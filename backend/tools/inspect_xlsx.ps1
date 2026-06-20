param(
  [Parameter(Mandatory = $true, ValueFromRemainingArguments = $true)]
  [string[]]$Paths
)

Add-Type -AssemblyName System.IO.Compression

function Read-EntryText {
  param(
    [System.IO.Compression.ZipArchive]$Zip,
    [string]$EntryName
  )

  $entry = $Zip.Entries | Where-Object { $_.FullName -eq $EntryName } | Select-Object -First 1
  if (-not $entry) {
    return $null
  }

  $reader = [System.IO.StreamReader]::new($entry.Open())
  try {
    return $reader.ReadToEnd()
  } finally {
    $reader.Dispose()
  }
}

function Get-SharedStringValue {
  param(
    [xml]$SharedStringsXml,
    [int]$Index
  )

  if (-not $SharedStringsXml) {
    return $Index
  }

  $ns = [System.Xml.XmlNamespaceManager]::new($SharedStringsXml.NameTable)
  $ns.AddNamespace("d", "http://schemas.openxmlformats.org/spreadsheetml/2006/main")
  $siNodes = $SharedStringsXml.SelectNodes("//d:sst/d:si", $ns)
  if ($Index -ge $siNodes.Count) {
    return $Index
  }

  $texts = $siNodes[$Index].SelectNodes(".//d:t", $ns) | ForEach-Object { $_.InnerText }
  return ($texts -join "")
}

function Get-XlsxSummary {
  param([string]$Path)

  $fileStream = [System.IO.FileStream]::new(
    $Path,
    [System.IO.FileMode]::Open,
    [System.IO.FileAccess]::Read,
    [System.IO.FileShare]::ReadWrite
  )

  try {
    $zip = [System.IO.Compression.ZipArchive]::new($fileStream, [System.IO.Compression.ZipArchiveMode]::Read, $false)
    try {
      $workbookXmlText = Read-EntryText -Zip $zip -EntryName "xl/workbook.xml"
      $relsXmlText = Read-EntryText -Zip $zip -EntryName "xl/_rels/workbook.xml.rels"
      $stylesXmlText = Read-EntryText -Zip $zip -EntryName "xl/styles.xml"
      $sharedStringsText = Read-EntryText -Zip $zip -EntryName "xl/sharedStrings.xml"

      $workbookXml = [xml]$workbookXmlText
      $relsXml = [xml]$relsXmlText
      $stylesXml = if ($stylesXmlText) { [xml]$stylesXmlText } else { $null }
      $sharedStringsXml = if ($sharedStringsText) { [xml]$sharedStringsText } else { $null }

      $wbNs = [System.Xml.XmlNamespaceManager]::new($workbookXml.NameTable)
      $wbNs.AddNamespace("d", "http://schemas.openxmlformats.org/spreadsheetml/2006/main")

      $relNs = [System.Xml.XmlNamespaceManager]::new($relsXml.NameTable)
      $relNs.AddNamespace("r", "http://schemas.openxmlformats.org/package/2006/relationships")

      $sheets = @()

      foreach ($sheet in $workbookXml.SelectNodes("//d:sheets/d:sheet", $wbNs)) {
        $rid = $sheet.GetAttribute("id", "http://schemas.openxmlformats.org/officeDocument/2006/relationships")
        $rel = $relsXml.SelectSingleNode("//r:Relationship[@Id='$rid']", $relNs)
        $target = $rel.Target.TrimStart("/")
        if (-not $target.StartsWith("xl/")) {
          $target = "xl/$target"
        }
        $sheetXmlText = Read-EntryText -Zip $zip -EntryName $target
        $sheetXml = [xml]$sheetXmlText

        $sheetNs = [System.Xml.XmlNamespaceManager]::new($sheetXml.NameTable)
        $sheetNs.AddNamespace("d", "http://schemas.openxmlformats.org/spreadsheetml/2006/main")

        $dimension = $sheetXml.SelectSingleNode("//d:dimension", $sheetNs)
        $mergeCells = $sheetXml.SelectNodes("//d:mergeCells/d:mergeCell", $sheetNs)
        $colNodes = $sheetXml.SelectNodes("//d:cols/d:col", $sheetNs)
        $rows = $sheetXml.SelectNodes("//d:sheetData/d:row", $sheetNs)

        $rowSamples = @()
        foreach ($row in ($rows | Select-Object -First 400)) {
          $cells = @()
          foreach ($cell in $row.SelectNodes("d:c", $sheetNs)) {
            $value = $null
            $inlineText = $cell.SelectSingleNode("d:is/d:t", $sheetNs)
            $valueNode = $cell.SelectSingleNode("d:v", $sheetNs)
            $formulaNode = $cell.SelectSingleNode("d:f", $sheetNs)

            if ($inlineText) {
              $value = $inlineText.InnerText
            } elseif ($valueNode) {
              $value = $valueNode.InnerText
              if ($cell.t -eq "s") {
                $value = Get-SharedStringValue -SharedStringsXml $sharedStringsXml -Index ([int]$value)
              }
            }

            if ($formulaNode) {
              $value = "=" + $formulaNode.InnerText
            }

            if ($null -ne $value -and "$value" -ne "") {
              $cells += [ordered]@{
                ref = $cell.r
                value = $value
                style = if ($cell.s) { [int]$cell.s } else { 0 }
              }
            }
          }

          if ($cells.Count -gt 0) {
            $rowSamples += [ordered]@{
              row = [int]$row.r
              height = if ($row.ht) { [double]$row.ht } else { $null }
              cells = $cells
            }
          }
        }

        $rowHeightSample = [ordered]@{}
        foreach ($row in ($rows | Select-Object -First 80)) {
          if ($row.ht) {
            $rowHeightSample["$($row.r)"] = [double]$row.ht
          }
        }

        $columnWidths = @()
        foreach ($col in $colNodes) {
          $columnWidths += [ordered]@{
            min = [int]$col.min
            max = [int]$col.max
            width = [double]$col.width
          }
        }

        $sheets += [ordered]@{
          title = $sheet.name
          dimension = if ($dimension) { $dimension.ref } else { $null }
          max_row_estimate = if ($dimension) { ($dimension.ref -split ":")[-1] } else { $null }
          merged_cells_count = $mergeCells.Count
          merged_cells_sample = @($mergeCells | Select-Object -First 80 | ForEach-Object { $_.ref })
          column_widths = $columnWidths
          row_heights_sample = $rowHeightSample
          non_empty_rows_sample = $rowSamples
        }
      }

      $styleSummary = $null
      if ($stylesXml) {
        $styleSummary = [ordered]@{
          fonts = $stylesXml.styleSheet.fonts.count
          fills = $stylesXml.styleSheet.fills.count
          borders = $stylesXml.styleSheet.borders.count
          cellXfs = $stylesXml.styleSheet.cellXfs.count
        }
      }

      return [ordered]@{
        file = $Path
        sheet_names = @($workbookXml.SelectNodes("//d:sheets/d:sheet", $wbNs) | ForEach-Object { $_.name })
        style_summary = $styleSummary
        sheets = $sheets
      }
    } finally {
      $zip.Dispose()
    }
  } finally {
    $fileStream.Dispose()
  }
}

$results = @()
foreach ($path in $Paths) {
  $results += Get-XlsxSummary -Path $path
}

$results | ConvertTo-Json -Depth 10
