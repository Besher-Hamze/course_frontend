Write-Host "Creating project folder structure with UTF-8 encoding (no BOM)..." -ForegroundColor Green

# Create main directories
$folders = @(
    "src\app\admin\courses\[id]\edit",
    "src\app\admin\courses\[id]\files",
    "src\app\admin\courses\[id]\videos",
    "src\app\admin\courses\create",
    "src\app\admin\students\[id]\edit",
    "src\app\admin\students\create",
    "src\app\admin\enrollments\create",
    "src\app\admin\files\[id]\edit",
    "src\app\admin\files\create",
    "src\app\admin\videos\[id]\edit",
    "src\app\admin\videos\create",
    "src\app\admin\dashboard",
    "src\app\auth\login",
    "src\app\auth\register",
    "src\components\ui",
    "src\components\layout",
    "src\components\forms",
    "src\components\dashboard",
    "src\lib\api",
    "src\lib\hooks",
    "src\lib\utils",
    "src\types",
    "src\contexts"
)

foreach ($folder in $folders) {
    New-Item -Path $folder -ItemType Directory -Force | Out-Null
    Write-Host "Created directory: $folder" -ForegroundColor Cyan
}

# Create files with UTF-8 encoding without BOM
$utf8NoBomEncoding = New-Object System.Text.UTF8Encoding $false
$files = @(
    "src\app\admin\courses\[id]\edit\page.tsx",
    "src\app\admin\courses\[id]\files\page.tsx",
    "src\app\admin\courses\[id]\videos\page.tsx",
    "src\app\admin\courses\[id]\page.tsx",
    "src\app\admin\courses\create\page.tsx",
    "src\app\admin\courses\page.tsx",
    "src\app\admin\students\[id]\edit\page.tsx",
    "src\app\admin\students\[id]\page.tsx",
    "src\app\admin\students\create\page.tsx",
    "src\app\admin\students\page.tsx",
    "src\app\admin\enrollments\create\page.tsx",
    "src\app\admin\enrollments\page.tsx",
    "src\app\admin\files\[id]\edit\page.tsx",
    "src\app\admin\files\create\page.tsx",
    "src\app\admin\files\page.tsx",
    "src\app\admin\videos\[id]\edit\page.tsx",
    "src\app\admin\videos\create\page.tsx",
    "src\app\admin\videos\page.tsx",
    "src\app\admin\dashboard\page.tsx",
    "src\app\admin\layout.tsx",
    "src\app\auth\login\page.tsx",
    "src\app\auth\register\page.tsx",
    "src\app\page.tsx",
    "src\app\layout.tsx",
    "src\components\ui\button.tsx",
    "src\components\ui\card.tsx",
    "src\components\ui\input.tsx",
    "src\components\ui\select.tsx",
    "src\components\ui\table.tsx",
    "src\components\ui\data-table.tsx",
    "src\components\layout\sidebar.tsx",
    "src\components\layout\header.tsx",
    "src\components\layout\footer.tsx",
    "src\components\forms\course-form.tsx",
    "src\components\forms\student-form.tsx",
    "src\components\forms\enrollment-form.tsx",
    "src\components\forms\file-form.tsx",
    "src\components\forms\video-form.tsx",
    "src\components\dashboard\stats-card.tsx",
    "src\components\dashboard\recent-activity.tsx",
    "src\lib\api\courses.ts",
    "src\lib\api\students.ts",
    "src\lib\api\enrollments.ts",
    "src\lib\api\files.ts",
    "src\lib\api\videos.ts",
    "src\lib\api\auth.ts",
    "src\lib\hooks\use-course.ts",
    "src\lib\hooks\use-student.ts",
    "src\lib\utils\api-client.ts",
    "src\lib\utils\format.ts",
    "src\types\course.ts",
    "src\types\student.ts",
    "src\types\enrollment.ts",
    "src\types\file.ts",
    "src\types\video.ts",
    "src\contexts\auth-context.tsx"
)

foreach ($file in $files) {
    # Create empty file with UTF-8 encoding without BOM
    if (!(Test-Path $file)) {
        New-Item -Path $file -ItemType File -Force | Out-Null
    }
    
    $content = "// Empty file"
    [System.IO.File]::WriteAllText($file, $content, $utf8NoBomEncoding)
    Write-Host "Created file: $file (UTF-8 no BOM)" -ForegroundColor Yellow
}

Write-Host "Project structure created successfully with UTF-8 encoding (no BOM)!" -ForegroundColor Green