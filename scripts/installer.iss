; SPDX-FileCopyrightText: 2026 Open-mind Contributors
; SPDX-License-Identifier: MIT
;
; Open-mind Professional Desktop Installer Script (Inno Setup 6)
; ─────────────────────────────────────────────────────────────
; Creates a production-ready, zero-dependency Windows Setup Wizard
; (OpenMind_Setup.exe) with Desktop shortcuts, Start Menu entry,
; uninstaller, and automatic clean upgrades.

#define MyAppName "OpenMind"
#define MyAppFullName "Open-mind - AI Study Assistant"
#define MyAppVersion "2.1.0"
#define MyAppPublisher "Open-mind AI Project"
#define MyAppURL "https://github.com/dargits/Openmind"
#define MyAppExeName "OpenMind.exe"

[Setup]
; Application identification GUID
AppId={{D3F98A71-4235-4E7B-A57E-4DF376D0B42E}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppFullName} v{#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}

; Destination: Install per-user into LocalAppData by default (no admin required),
; but allow user to select per-machine if running with elevated privileges.
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes

; Output Configuration
OutputDir=..\dist
OutputBaseFilename=OpenMind_Setup
SetupIconFile=..\ui\logo.ico
UninstallDisplayIcon={app}\{#MyAppExeName}
Compression=lzma2/ultra64
SolidCompression=yes

; User Interface & Polish
WizardStyle=modern
WizardSizePercent=110
DisableWelcomePage=no
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
CloseApplications=yes
RestartApplications=no

[Languages]
Name: "vietnamese"; MessagesFile: "Vietnamese.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[CustomMessages]
vietnamese.CreateDesktopIcon=Tạo biểu tượng ngoài màn hình Desktop
vietnamese.AdditionalIcons=Tùy chọn bổ sung:
vietnamese.LaunchProgram=Khởi chạy %1 ngay bây giờ
english.CreateDesktopIcon=Create a &desktop shortcut
english.AdditionalIcons=Additional shortcuts:
english.LaunchProgram=Launch %1 now

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[InstallDelete]
; Làm sạch cơ sở dữ liệu và tệp tải về cá nhân cũ của người build hoặc phiên bản cũ
Type: files; Name: "{app}\data\openmind.db"
Type: files; Name: "{app}\data\openmind.db-shm"
Type: files; Name: "{app}\data\openmind.db-wal"
Type: files; Name: "{app}\data\openmind.db-journal"
Type: filesandordirs; Name: "{app}\data\downloads"
Type: filesandordirs; Name: "{app}\data\outputs"
Type: filesandordirs; Name: "{app}\data\samples"

[Files]
Source: "..\dist\OpenMind\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "*.db,*.db-shm,*.db-wal,*.db-journal,*.log,*.download,data\downloads\*,data\outputs\*,data\samples\*,_internal\data\*.db*"

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\ui\logo.ico"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\ui\logo.ico"; Tasks: desktopicon

[UninstallDelete]
Type: filesandordirs; Name: "{app}\data"

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#MyAppName}}"; Flags: nowait postinstall skipifsilent
