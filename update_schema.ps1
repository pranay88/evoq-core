
$schema = Get-Content prisma\schema.prisma -Raw
$schema = $schema -replace "officialPhone\s+String\?", "officialPhone      String?`n    baseSalary         Float   @default(0)"
Set-Content prisma\schema.prisma -Value $schema

