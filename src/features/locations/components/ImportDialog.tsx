import { useState, useCallback } from 'react'
import Papa from 'papaparse'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, AlertCircle, CheckCircle2, X } from 'lucide-react'
import { csvLocationSchema, type CsvLocation } from '../schema'
import type { ImportResult } from '../api/locationsClient'

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (locations: CsvLocation[]) => Promise<ImportResult>
}

export function ImportDialog({ open, onOpenChange, onImport }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<CsvLocation[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setParseErrors([])
    setParsedData([])
    setImportResult(null)

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = []
        const validLocations: CsvLocation[] = []

        results.data.forEach((row: any, index: number) => {
          try {
            const parsed = csvLocationSchema.parse(row)
            validLocations.push(parsed)
          } catch (error: any) {
            errors.push(`Row ${index + 1}: ${error.message}`)
          }
        })

        setParseErrors(errors)
        setParsedData(validLocations)
      },
      error: (error) => {
        setParseErrors([`Parse error: ${error.message}`])
      },
    })
  }, [])

  const handleImport = async () => {
    if (parsedData.length === 0) return

    setIsImporting(true)
    try {
      const result = await onImport(parsedData)
      setImportResult(result)

      // If all succeeded, close dialog after a delay
      if (result.failed === 0) {
        setTimeout(() => {
          handleReset()
          onOpenChange(false)
        }, 2000)
      }
    } catch (error) {
      console.error('Import error:', error)
      setParseErrors([error instanceof Error ? error.message : 'Import failed'])
    } finally {
      setIsImporting(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setParsedData([])
    setParseErrors([])
    setImportResult(null)
  }

  const handleClose = () => {
    handleReset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Locations from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file with location data. Required columns: name, type, address_line1,
            city, state, postal_code
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Input */}
          {!file && (
            <div className="rounded-lg border-2 border-dashed p-8 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload">
                <Button variant="outline" asChild>
                  <span className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" />
                    Choose CSV File
                  </span>
                </Button>
              </label>
              <p className="mt-2 text-sm text-muted-foreground">
                Drag & drop or click to select
              </p>
            </div>
          )}

          {/* File Selected */}
          {file && !importResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{file.name}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={handleReset}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Parse Results */}
              {parsedData.length > 0 && (
                <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-950">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">
                      {parsedData.length} valid location(s) ready to import
                    </span>
                  </div>
                </div>
              )}

              {/* Parse Errors */}
              {parseErrors.length > 0 && (
                <div className="rounded-lg border bg-destructive/10 p-4">
                  <div className="mb-2 flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">{parseErrors.length} error(s) found</span>
                  </div>
                  <ul className="ml-7 space-y-1 text-sm">
                    {parseErrors.slice(0, 5).map((error, i) => (
                      <li key={i} className="text-destructive">
                        {error}
                      </li>
                    ))}
                    {parseErrors.length > 5 && (
                      <li className="text-muted-foreground">
                        ...and {parseErrors.length - 5} more errors
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Import Results */}
          {importResult && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-primary/10 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="font-medium">Import Complete</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Successfully imported:</span>
                    <Badge variant="default">{importResult.success}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Failed:</span>
                    <Badge variant={importResult.failed > 0 ? 'destructive' : 'outline'}>
                      {importResult.failed}
                    </Badge>
                  </div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="rounded-lg border bg-destructive/10 p-4">
                  <div className="mb-2 font-medium text-destructive">Failed Imports:</div>
                  <ul className="space-y-1 text-sm">
                    {importResult.errors.slice(0, 5).map((error, i) => (
                      <li key={i} className="text-destructive">
                        Row {error.row}: {error.error}
                      </li>
                    ))}
                    {importResult.errors.length > 5 && (
                      <li className="text-muted-foreground">
                        ...and {importResult.errors.length - 5} more errors
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Example Format */}
          <details className="rounded-lg border p-4">
            <summary className="cursor-pointer font-medium">CSV Format Example</summary>
            <pre className="mt-4 overflow-x-auto rounded bg-muted p-4 text-xs">
{`name,type,address_line1,address_line2,city,state,postal_code,country,notes
Safari Home,residential,123 Safari Ln,,Dallas,TX,75201,US,Test import
Pool Supply HQ,commercial,45 Water Way,,Fort Worth,TX,76107,US,Main location`}
            </pre>
          </details>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {importResult ? 'Close' : 'Cancel'}
          </Button>
          {!importResult && (
            <Button
              onClick={handleImport}
              disabled={parsedData.length === 0 || isImporting}
            >
              {isImporting ? 'Importing...' : `Import ${parsedData.length} Location(s)`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
