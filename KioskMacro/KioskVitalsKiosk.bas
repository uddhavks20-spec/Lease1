'====================================================================
' INTERACTIVE VITALS VISUALIZATION KIOSK - SolidWorks VBA Macro
' Target: SolidWorks 2022+
' Reference: Sertek Heartbeat Drum Exhibit + HTT-PP-0804202601
'
' HOW TO RUN:
' 1. Open SolidWorks
' 2. Tools > Macro > New (opens VBA Editor)
' 3. Tools > References > Browse > select sldworks.tlb
'    Path: C:\Program Files\SOLIDWORKS Corp\SOLIDWORKS\sldworks.tlb
' 4. File > Import File > select this .bas file
' 5. F5 > BuildEntireKiosk
'====================================================================
Option Explicit

'--- Application References (early binding - requires type library) ---
Dim g_swApp As SldWorks.SldWorks
Dim g_swModel As SldWorks.ModelDoc2
Dim g_swPart As SldWorks.PartDoc
Dim g_swAssy As SldWorks.AssemblyDoc
Dim g_swSkMgr As SldWorks.SketchManager
Dim g_swFeatMgr As SldWorks.FeatureManager

Const MM As Double = 0.001

'--- Project Path ---
Const PROJ_PATH As String = "C:\Users\kisha\Documents\Kiosk\"

'=== DIMENSIONS (mm) ===
Const TW As Double = 500     ' tower width
Const TD As Double = 400     ' tower depth
Const TH As Double = 1600    ' tower height
Const FS As Double = 40      ' frame size
Const FW As Double = 3       ' frame wall
Const PT As Double = 8       ' panel thickness

Const DW As Double = 230     ' display width
Const DH As Double = 155     ' display height
Const DY As Double = 1050    ' display center Y

Const LW As Double = 20      ' LED channel width
Const LDp As Double = 12     ' LED channel depth

Const DD As Double = 380     ' drum diameter
Const DDe As Double = 150    ' drum depth
Const DWal As Double = 6     ' drum wall
Const DHT As Double = 2      ' drum head thick
Const DYh As Double = 1600   ' drum Y height (bottom of drum sits on top of tower)

Const HH As Double = 100     ' heart height
Const HW As Double = 90      ' heart width
Const HDp As Double = 70     ' heart depth
Const DMD As Double = 150    ' dome diameter
Const DMW As Double = 3      ' dome wall
Const HYh As Double = 1675   ' heart Y height (at drum center)

Const PW As Double = 500     ' platform width
Const PDim As Double = 500   ' platform depth
Const PH As Double = 80      ' platform height
Const PS As Double = 3       ' platform shell
Const PMT As Double = 2      ' platform mat thick
Const PCR As Double = 10     ' platform corner radius

Const SERVO_W As Double = 23
Const SERVO_H As Double = 12
Const SERVO_D As Double = 29
Const LINKAGE_T As Double = 2
Const LINKAGE_L As Double = 30

'--------------------------------------------------------------------
' MAIN ENTRY POINT
'--------------------------------------------------------------------
Sub BuildEntireKiosk()
    '--- Runtime check for SolidWorks ---
    On Error Resume Next
    Set g_swApp = Application.SldWorks
    If g_swApp Is Nothing Then
        MsgBox "Cannot access SolidWorks." & vbCrLf & vbCrLf & _
               "CHECK:" & vbCrLf & _
               "1. You must run this from within SolidWorks" & vbCrLf & _
               "2. VBA Editor > Tools > References > check" & vbCrLf & _
               "   'SOLIDWORKS 20XX Type Library'" & vbCrLf & _
               "3. Make sure macros are enabled", vbCritical, "Setup Error"
        End
    End If
    On Error GoTo 0
    
    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    If Not fso.FolderExists(PROJ_PATH) Then
        fso.CreateFolder PROJ_PATH
    End If
    ' Ensure C:\Users\kisha\Documents exists
    If Not fso.FolderExists("C:\Users\kisha\Documents") Then
        fso.CreateFolder "C:\Users\kisha\Documents"
    End If
    
    Debug.Print "=== Building Kiosk Assembly ==="
    
    CreateKioskTower
    CreateDrumModule
    CreateHeartModel
    CreateWeightPlatform
    CreateDisplayBezel
    
    Debug.Print "=== ALL PARTS COMPLETE ==="
    MsgBox "All 5 parts created!" & vbCrLf & vbCrLf & _
           "They are open as separate tabs in SolidWorks." & vbCrLf & _
           "Save each part: File > Save As > choose location." & vbCrLf & vbCrLf & _
           "To assemble: File > New > Assembly > Insert > Browse" & vbCrLf & _
           "and select each saved part." & vbCrLf & vbCrLf & _
           "See Immediate Window (Ctrl+G) for debug info.", _
           vbInformation, "Kiosk Built"
    
    Debug.Print "=== BUILD COMPLETE ==="
    MsgBox "Kiosk build complete!" & vbCrLf & "Files saved to: " & PROJ_PATH
End Sub

'--------------------------------------------------------------------
' HELPERS
'--------------------------------------------------------------------
Function m(val As Double) As Double
    m = val * MM
End Function

Function GetPartTemplate() As String
    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    Dim knownPath As String
    knownPath = "C:\ProgramData\SolidWorks\SOLIDWORKS 2026\templates\MBD\part 0251mm to 1000mm.prtdot"
    If fso.FileExists(knownPath) Then
        GetPartTemplate = knownPath
        Debug.Print "Part template: " & GetPartTemplate
        Exit Function
    End If
    ' Fallback to API
    On Error Resume Next
    GetPartTemplate = g_swApp.GetUserPreferenceStringValue(swUserPreferenceStringValue_e.swDefaultTemplatePart)
    On Error GoTo 0
End Function

Function GetAssyTemplate() As String
    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    Dim knownPath As String
    knownPath = "C:\ProgramData\SolidWorks\SOLIDWORKS 2026\templates\MBD\assembly 0251mm to 1000mm.asmdot"
    If fso.FileExists(knownPath) Then
        GetAssyTemplate = knownPath
        Debug.Print "Assembly template: " & GetAssyTemplate
        Exit Function
    End If
    ' Fallback to API
    On Error Resume Next
    GetAssyTemplate = g_swApp.GetUserPreferenceStringValue(swUserPreferenceStringValue_e.swDefaultTemplateAssembly)
    On Error GoTo 0
End Function

Sub LogErr(op As String)
    If Err.Number <> 0 Then Debug.Print "ERR " & op & ": " & Err.Description
End Sub

Function NewPart() As Boolean
    Dim tmpl As String
    tmpl = GetPartTemplate
    If tmpl = "" Then
        MsgBox "No part template found." & vbCrLf & _
               "Checked: C:\ProgramData\SolidWorks\SOLIDWORKS 20XX\templates\" & vbCrLf & _
               "Try setting your default part template in SolidWorks first:" & vbCrLf & _
               "Tools > Options > System Options > File Locations > Document Templates", _
               vbCritical, "Template Error"
        NewPart = False
        Exit Function
    End If
    Debug.Print "Part template: " & tmpl
    Set g_swModel = g_swApp.NewDocument(tmpl, 0, 0, 0)
    If g_swModel Is Nothing Then
        MsgBox "Failed to create part document." & vbCrLf & "Template: " & tmpl, vbCritical
        NewPart = False
        Exit Function
    End If
    Set g_swPart = g_swModel
    Set g_swSkMgr = g_swModel.SketchManager
    Set g_swFeatMgr = g_swModel.FeatureManager
    NewPart = True
End Function

Function NewAssembly() As Boolean
    Dim tmpl As String
    tmpl = GetAssyTemplate
    
    If tmpl <> "" Then
        Debug.Print "Assembly template: " & tmpl
        On Error Resume Next
        Set g_swModel = g_swApp.NewDocument(tmpl, 0, 0, 0)
        On Error GoTo 0
    End If
    
    If g_swModel Is Nothing Then
        Debug.Print "Template method failed, trying default..."
        On Error Resume Next
        Set g_swModel = g_swApp.NewDocument2(2)
        On Error GoTo 0
    End If
    
    If g_swModel Is Nothing Then
        MsgBox "Could not create assembly." & vbCrLf & _
               "Please create one manually:" & vbCrLf & _
               "1. File > New > Assembly" & vbCrLf & _
               "2. Then run AssembleAll from VBA editor", _
               vbCritical, "Assembly Error"
        NewAssembly = False
        Exit Function
    End If
    
    Set g_swAssy = g_swModel
    Set g_swSkMgr = g_swModel.SketchManager
    Set g_swFeatMgr = g_swModel.FeatureManager
    NewAssembly = True
End Function

Sub SelPlane(name As String)
    g_swModel.Extension.SelectByID2 name, "PLANE", 0, 0, 0, False, 0, Nothing, 0
End Sub

Sub StartSketch(plane As String)
    SelPlane plane
    g_swSkMgr.InsertSketch True
End Sub

Sub EndSketch()
    g_swSkMgr.InsertSketch True
End Sub

Sub Rebuild()
    g_swModel.ForceRebuild3 True
End Sub

Function DoExtrude(depthM As Double) As Object
    Set DoExtrude = g_swFeatMgr.FeatureExtrusion3( _
        True, False, False, _
        0, 0, _
        depthM, 0, _
        False, False, _
        False, False, _
        0, 0, _
        False, False, _
        False, False, _
        True, True, True, _
        0, 0, False)
End Function

Function DoExtrudeMid(depthM As Double) As Object
    Set DoExtrudeMid = g_swFeatMgr.FeatureExtrusion3( _
        False, False, False, _
        6, 0, _
        depthM / 2, 0, _
        False, False, _
        False, False, _
        0, 0, _
        False, False, _
        False, False, _
        True, True, True, _
        0, 0, False)
End Function

Function DoExtrudeRev(depthM As Double) As Object
    Set DoExtrudeRev = g_swFeatMgr.FeatureExtrusion3( _
        True, True, False, _
        0, 0, _
        depthM, 0, _
        False, False, _
        False, False, _
        0, 0, _
        False, False, _
        False, False, _
        True, True, True, _
        0, 0, False)
End Function

Function DoCut(depthM As Double) As Object
    Set DoCut = g_swFeatMgr.FeatureCut4( _
        True, False, False, _
        0, 0, _
        depthM, 0, _
        False, False, _
        False, False, _
        0, 0, _
        False, False, _
        False, False, _
        False, _
        True, True, _
        True, True, False, _
        0, 0, False, False)
End Function

Function DoCutThru() As Object
    Set DoCutThru = g_swFeatMgr.FeatureCut4( _
        True, False, False, _
        1, 0, _
        0.01, 0.01, _
        False, False, _
        False, False, _
        0, 0, _
        False, False, _
        False, False, _
        False, _
        True, True, _
        True, True, False, _
        0, 0, False, False)
End Function

Function DoRevolve() As Object
    On Error Resume Next
    Set DoRevolve = CallByName(g_swFeatMgr, "FeatureRevolve2", VbMethod, _
        True, True, False, False, False, True, _
        CLng(0), CLng(0), _
        6.283185307, 0#, _
        False, False, 0#, 0#, _
        CLng(0), 0#, 0#, _
        True, False, True)
    On Error GoTo 0
End Function

Sub SaveDoc(name As String)
    Dim path As String
    path = PROJ_PATH & name
    Debug.Print "  SaveDoc: " & path
    
    On Error Resume Next
    
    ' Try the most basic approach
    Dim docType As Long
    docType = 1 ' swDocPART
    
    ' Method: call SaveAs via CallByName (forces late binding)
    CallByName g_swModel, "SaveAs3", VbMethod, path, CLng(0), CLng(0)
    
    If Err.Number <> 0 Then
        Debug.Print "  SaveAs3 failed: " & Err.Description
        Err.Clear
        
        ' Method 2: save with .SLDPRT extension forced
        CallByName g_swModel, "SaveAs", VbMethod, path, CLng(0), CLng(0)
    End If
    
    On Error GoTo 0
    
    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    If fso.FileExists(path) Then
        Debug.Print "  CONFIRMED: " & path
    Else
        Debug.Print "  NOT ON DISK: " & path & " (use File>Save As in SolidWorks)"
    End If
End Sub

Function CreateOffsetPlane(refPlane As String, distanceM As Double) As String
    Dim pf As Object
    SelPlane refPlane
    ' InsertRefPlane(FirstConstraint, Distance, SecondConstraint, 0, ThirdConstraint, 0)
    ' 8 = swRefPlaneReferenceConstraint_Distance
    Set pf = g_swFeatMgr.InsertRefPlane(8, distanceM, 0, 0, 0, 0)
    If Not pf Is Nothing Then
        CreateOffsetPlane = pf.Name
    Else
        CreateOffsetPlane = ""
    End If
End Function

'====================================================================
' MODULE 1: KIOSK TOWER
'====================================================================
Sub CreateKioskTower()
    Debug.Print "=== Building Kiosk Tower ==="
    
    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    If fso.FileExists(PROJ_PATH & "KioskTower.SLDPRT") Then
        Debug.Print "Tower part exists, skipping"
        Exit Sub
    End If
    
    If Not NewPart Then Exit Sub
    
    Dim f As Object
    Dim i As Long
    Dim cx As Double, cz As Double
    Dim hfs As Double, hfi As Double
    Dim pfName As String
    
    hfs = m(FS / 2)
    hfi = m((FS - 2 * FW) / 2)
    
    '--------------------------------------------------------------
    ' 1. Vertical frame posts (4 corners)
    '--------------------------------------------------------------
    StartSketch "Top Plane"
    
    Dim cxVals As Variant
    Dim czVals As Variant
    cxVals = Array(m(-TW / 2 + FS / 2), m(TW / 2 - FS / 2), m(-TW / 2 + FS / 2), m(TW / 2 - FS / 2))
    czVals = Array(m(TD / 2 - FS / 2), m(TD / 2 - FS / 2), m(-TD / 2 + FS / 2), m(-TD / 2 + FS / 2))
    
    For i = 0 To 3
        cx = cxVals(i)
        cz = czVals(i)
        g_swSkMgr.CreateCenterRectangle cx, cz, 0, cx + hfs, cz + hfs, 0
        g_swSkMgr.CreateCenterRectangle cx, cz, 0, cx + hfi, cz + hfi, 0
    Next i
    
    EndSketch
    Set f = DoExtrude(m(TH))
    If Not f Is Nothing Then f.Name = "Frame_VerticalPosts"
    LogErr "Vertical Posts"
    Rebuild
    
    '--------------------------------------------------------------
    ' 2. Bottom horizontal rails
    '--------------------------------------------------------------
    Dim yBot As Double
    yBot = m(FS / 2)
    
    ' Front + Rear rails (sketch on Right Plane, extrude in X)
    StartSketch "Right Plane"
    ' Front rail
    g_swSkMgr.CreateCenterRectangle m(TD / 2 - FS / 2), yBot, 0, _
        m(TD / 2 - FS / 2) + hfs, yBot + hfs, 0
    g_swSkMgr.CreateCenterRectangle m(TD / 2 - FS / 2), yBot, 0, _
        m(TD / 2 - FS / 2) + hfi, yBot + hfi, 0
    ' Rear rail
    g_swSkMgr.CreateCenterRectangle m(-TD / 2 + FS / 2), yBot, 0, _
        m(-TD / 2 + FS / 2) + hfs, yBot + hfs, 0
    g_swSkMgr.CreateCenterRectangle m(-TD / 2 + FS / 2), yBot, 0, _
        m(-TD / 2 + FS / 2) + hfi, yBot + hfi, 0
    EndSketch
    Set f = DoExtrudeMid(m(TW - 2 * FS))
    If Not f Is Nothing Then f.Name = "Frame_BottomFrontRear"
    LogErr "Bottom F/R Rails"
    Rebuild
    
    ' Left + Right rails (sketch on Front Plane, extrude in Z)
    StartSketch "Front Plane"
    g_swSkMgr.CreateCenterRectangle m(-TW / 2 + FS / 2), yBot, 0, _
        m(-TW / 2 + FS / 2) + hfs, yBot + hfs, 0
    g_swSkMgr.CreateCenterRectangle m(-TW / 2 + FS / 2), yBot, 0, _
        m(-TW / 2 + FS / 2) + hfi, yBot + hfi, 0
    g_swSkMgr.CreateCenterRectangle m(TW / 2 - FS / 2), yBot, 0, _
        m(TW / 2 - FS / 2) + hfs, yBot + hfs, 0
    g_swSkMgr.CreateCenterRectangle m(TW / 2 - FS / 2), yBot, 0, _
        m(TW / 2 - FS / 2) + hfi, yBot + hfi, 0
    EndSketch
    Set f = DoExtrudeMid(m(TD - 2 * FS))
    If Not f Is Nothing Then f.Name = "Frame_BottomLeftRight"
    LogErr "Bottom L/R Rails"
    Rebuild
    
    '--------------------------------------------------------------
    ' 3. Top horizontal rails
    '--------------------------------------------------------------
    Dim yTop As Double
    yTop = m(FS / 2)
    
    pfName = CreateOffsetPlane("Right Plane", m(TH - FS))
    If pfName <> "" Then
        Dim pf As Object
        SelPlane pfName
        Set pf = g_swModel.SelectionManager.GetSelectedObject6(1, -1)
        If Not pf Is Nothing Then pf.Name = "Plane_TopFRails"
    End If
    
    StartSketch pfName
    g_swSkMgr.CreateCenterRectangle m(TD / 2 - FS / 2), yTop, 0, _
        m(TD / 2 - FS / 2) + hfs, yTop + hfs, 0
    g_swSkMgr.CreateCenterRectangle m(TD / 2 - FS / 2), yTop, 0, _
        m(TD / 2 - FS / 2) + hfi, yTop + hfi, 0
    g_swSkMgr.CreateCenterRectangle m(-TD / 2 + FS / 2), yTop, 0, _
        m(-TD / 2 + FS / 2) + hfs, yTop + hfs, 0
    g_swSkMgr.CreateCenterRectangle m(-TD / 2 + FS / 2), yTop, 0, _
        m(-TD / 2 + FS / 2) + hfi, yTop + hfi, 0
    EndSketch
    Set f = DoExtrudeMid(m(TW - 2 * FS))
    If Not f Is Nothing Then f.Name = "Frame_TopFrontRear"
    LogErr "Top F/R Rails"
    Rebuild
    
    ' Top side rails
    pfName = CreateOffsetPlane("Front Plane", m(TH - FS))
    If pfName <> "" Then
        SelPlane pfName
        Set pf = g_swModel.SelectionManager.GetSelectedObject6(1, -1)
        If Not pf Is Nothing Then pf.Name = "Plane_TopLRails"
    End If
    
    StartSketch pfName
    g_swSkMgr.CreateCenterRectangle m(-TW / 2 + FS / 2), yTop, 0, _
        m(-TW / 2 + FS / 2) + hfs, yTop + hfs, 0
    g_swSkMgr.CreateCenterRectangle m(-TW / 2 + FS / 2), yTop, 0, _
        m(-TW / 2 + FS / 2) + hfi, yTop + hfi, 0
    g_swSkMgr.CreateCenterRectangle m(TW / 2 - FS / 2), yTop, 0, _
        m(TW / 2 - FS / 2) + hfs, yTop + hfs, 0
    g_swSkMgr.CreateCenterRectangle m(TW / 2 - FS / 2), yTop, 0, _
        m(TW / 2 - FS / 2) + hfi, yTop + hfi, 0
    EndSketch
    Set f = DoExtrudeMid(m(TD - 2 * FS))
    If Not f Is Nothing Then f.Name = "Frame_TopLeftRight"
    LogErr "Top L/R Rails"
    Rebuild
    
    '--------------------------------------------------------------
    ' 4. Front panel (acrylic, 8mm) - flush with front face
    '--------------------------------------------------------------
    Dim frontPanelPlane As String
    pfName = CreateOffsetPlane("Front Plane", m(TD / 2 - PT))
    frontPanelPlane = pfName
    If pfName <> "" Then
        SelPlane pfName
        Set pf = g_swModel.SelectionManager.GetSelectedObject6(1, -1)
        If Not pf Is Nothing Then pf.Name = "Plane_FrontPanel"
    End If
    
    StartSketch pfName
    g_swSkMgr.CreateCornerRectangle _
        m(-TW / 2 + FS), 0, 0, _
        m(TW / 2 - FS), m(TH - FS), 0
    EndSketch
    Set f = DoExtrude(m(PT))
    If Not f Is Nothing Then f.Name = "FrontPanel"
    LogErr "Front Panel"
    Rebuild
    
    '--------------------------------------------------------------
    ' 5. Display cutout
    '--------------------------------------------------------------
    pfName = CreateOffsetPlane("Front Plane", m(TD / 2 - FS / 2 + PT))
    If pfName <> "" Then
        SelPlane pfName
        Set pf = g_swModel.SelectionManager.GetSelectedObject6(1, -1)
        If Not pf Is Nothing Then pf.Name = "Plane_DisplayOuter"
    End If
    
    StartSketch pfName
    g_swSkMgr.CreateCornerRectangle _
        m(-DW / 2), m(DY - DH / 2), 0, _
        m(DW / 2), m(DY + DH / 2), 0
    EndSketch
    Set f = DoCutThru
    If Not f Is Nothing Then f.Name = "DisplayCutout"
    LogErr "Display Cutout"
    Rebuild
    
    ' Display pocket (8mm deep recess)
    StartSketch pfName
    g_swSkMgr.CreateCornerRectangle _
        m(-DW / 2 + 5), m(DY - DH / 2 + 5), 0, _
        m(DW / 2 - 5), m(DY + DH / 2 - 5), 0
    EndSketch
    Set f = g_swFeatMgr.FeatureCut4( _
        True, True, False, _
        CLng(0), CLng(0), _
        m(8), 0#, _
        False, False, _
        False, False, _
        0#, 0#, _
        False, False, _
        False, False, _
        False, _
        True, True, _
        True, True, False, _
        CLng(0), 0#, False, False)
    If Not f Is Nothing Then f.Name = "DisplayPocket"
    LogErr "Display Pocket"
    Rebuild
    
    '--------------------------------------------------------------
    ' 6. Side panels
    '--------------------------------------------------------------
    pfName = CreateOffsetPlane("Right Plane", m(-TW / 2 + FS / 2))
    If pfName <> "" Then
        SelPlane pfName
        Set pf = g_swModel.SelectionManager.GetSelectedObject6(1, -1)
        If Not pf Is Nothing Then pf.Name = "Plane_LeftPanel"
    End If
    
    StartSketch pfName
    g_swSkMgr.CreateCornerRectangle _
        m(-TD / 2 + FS), 0, 0, _
        m(TD / 2 - FS), m(TH - FS), 0
    EndSketch
    Set f = DoExtrude(m(PT))
    If Not f Is Nothing Then f.Name = "LeftPanel"
    LogErr "Left Panel"
    Rebuild
    
    pfName = CreateOffsetPlane("Right Plane", m(TW / 2 - FS / 2))
    If pfName <> "" Then
        SelPlane pfName
        Set pf = g_swModel.SelectionManager.GetSelectedObject6(1, -1)
        If Not pf Is Nothing Then pf.Name = "Plane_RightPanel"
    End If
    
    StartSketch pfName
    g_swSkMgr.CreateCornerRectangle _
        m(-TD / 2 + FS), 0, 0, _
        m(TD / 2 - FS), m(TH - FS), 0
    EndSketch
    Set f = DoExtrude(m(PT))
    If Not f Is Nothing Then f.Name = "RightPanel"
    LogErr "Right Panel"
    Rebuild
    
    '--------------------------------------------------------------
    ' 7. Rear panel with M4 holes
    '--------------------------------------------------------------
    pfName = CreateOffsetPlane("Front Plane", m(-TD / 2 + FS / 2))
    If pfName <> "" Then
        SelPlane pfName
        Set pf = g_swModel.SelectionManager.GetSelectedObject6(1, -1)
        If Not pf Is Nothing Then pf.Name = "Plane_RearPanel"
    End If
    
    StartSketch pfName
    g_swSkMgr.CreateCornerRectangle _
        m(-TW / 2 + FS), 0, 0, _
        m(TW / 2 - FS), m(TH - FS), 0
    EndSketch
    Set f = DoExtrudeRev(m(PT))
    If Not f Is Nothing Then f.Name = "RearPanel"
    LogErr "Rear Panel"
    Rebuild
    
    ' M4 holes (4 corners)
    StartSketch pfName
    Dim hs As Double
    Dim vs As Double
    hs = m(TW / 2 - FS - 30)
    vs = m(TH - FS - 30)
    g_swSkMgr.CreateCircle -hs, m(30), 0, -hs + m(0.002), m(30), 0
    g_swSkMgr.CreateCircle hs, m(30), 0, hs + m(0.002), m(30), 0
    g_swSkMgr.CreateCircle -hs, vs, 0, -hs + m(0.002), vs, 0
    g_swSkMgr.CreateCircle hs, vs, 0, hs + m(0.002), vs, 0
    EndSketch
    Set f = DoCutThru
    If Not f Is Nothing Then f.Name = "RearPanel_M4Holes"
    LogErr "Rear Panel Holes"
    Rebuild
    
    '--------------------------------------------------------------
    ' 8. Top cap
    '--------------------------------------------------------------
    pfName = CreateOffsetPlane("Top Plane", m(TH - FS))
    
    StartSketch pfName
    g_swSkMgr.CreateCornerRectangle _
        m(-TW / 2 + FS / 2), m(-TD / 2 + FS / 2), 0, _
        m(TW / 2 - FS / 2), m(TD / 2 - FS / 2), 0
    EndSketch
    Set f = DoExtrude(m(PT))
    If Not f Is Nothing Then f.Name = "TopCap"
    LogErr "Top Cap"
    Rebuild
    
    '--------------------------------------------------------------
    ' 9. LED edge channels (on front panel)
    '--------------------------------------------------------------
    ' Left channel
    SelPlane frontPanelPlane
    g_swSkMgr.InsertSketch True
    g_swSkMgr.CreateCornerRectangle _
        m(-TW / 2 + FS + 2), m(10), 0, _
        m(-TW / 2 + FS + 2 + LW), m(TH - FS - 10), 0
    EndSketch
    Set f = DoCut(m(LDp))
    If Not f Is Nothing Then f.Name = "LeftLEDChannel"
    LogErr "Left LED Channel"
    Rebuild
    
    ' Right channel
    SelPlane frontPanelPlane
    g_swSkMgr.InsertSketch True
    g_swSkMgr.CreateCornerRectangle _
        m(TW / 2 - FS - 2 - LW), m(10), 0, _
        m(TW / 2 - FS - 2), m(TH - FS - 10), 0
    EndSketch
    Set f = DoCut(m(LDp))
    If Not f Is Nothing Then f.Name = "RightLEDChannel"
    LogErr "Right LED Channel"
    Rebuild
    
    '--------------------------------------------------------------
    ' 10. Internal cable tray (U-channel, vertical, on Top Plane)
    '--------------------------------------------------------------
    ' U-channel centered in tower interior, open toward front (+Z)
    StartSketch "Top Plane"
    Dim ctHalfW As Double, ctDepth As Double, ctWall As Double
    ctHalfW = m(30)
    ctDepth = m(40)
    ctWall = m(3)
    Dim ctZ As Double
    ctZ = m(TD / 2 - FS - 80)   ' position near front, inside cable space
    
    g_swSkMgr.CreateLine -ctHalfW, ctZ - ctDepth, 0, ctHalfW, ctZ - ctDepth, 0
    g_swSkMgr.CreateLine ctHalfW, ctZ - ctDepth, 0, ctHalfW, ctZ, 0
    g_swSkMgr.CreateLine ctHalfW, ctZ, 0, ctHalfW - ctWall, ctZ, 0
    g_swSkMgr.CreateLine ctHalfW - ctWall, ctZ, 0, ctHalfW - ctWall, ctZ - ctDepth + ctWall, 0
    g_swSkMgr.CreateLine ctHalfW - ctWall, ctZ - ctDepth + ctWall, 0, -ctHalfW + ctWall, ctZ - ctDepth + ctWall, 0
    g_swSkMgr.CreateLine -ctHalfW + ctWall, ctZ - ctDepth + ctWall, 0, -ctHalfW + ctWall, ctZ, 0
    g_swSkMgr.CreateLine -ctHalfW + ctWall, ctZ, 0, -ctHalfW, ctZ, 0
    g_swSkMgr.CreateLine -ctHalfW, ctZ, 0, -ctHalfW, ctZ - ctDepth, 0
    EndSketch
    Set f = DoExtrude(m(TH - FS))
    If Not f Is Nothing Then f.Name = "InternalCableTray"
    LogErr "Cable Tray"
    Rebuild
    
    SaveDoc "KioskTower.SLDPRT"
    ' Keep part open - don't close
    Debug.Print "Kiosk Tower complete"
End Sub

'====================================================================
' MODULE 2: DRUM MODULE
'====================================================================
Sub CreateDrumModule()
    Debug.Print "=== Building Drum Module ==="
    
    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    If fso.FileExists(PROJ_PATH & "DrumModule.SLDPRT") Then
        Debug.Print "Drum module exists, skipping"
        Exit Sub
    End If
    
    If Not NewPart Then Exit Sub
    
    Dim f As Object
    Dim ro As Double, ri As Double, dp As Double
    ro = m(DD / 2)
    ri = m(DD / 2 - DWal)
    dp = m(DDe)
    
    '--------------------------------------------------------------
    ' 1. Drum shell (revolved hollow cylinder)
    '--------------------------------------------------------------
    StartSketch "Front Plane"
    g_swSkMgr.CreateCenterline 0, 0, 0, 0, dp, 0
    g_swSkMgr.CreateLine ri, 0, 0, ro, 0, 0
    g_swSkMgr.CreateLine ro, 0, 0, ro, dp, 0
    g_swSkMgr.CreateLine ro, dp, 0, ri, dp, 0
    g_swSkMgr.CreateLine ri, dp, 0, ri, 0, 0
    EndSketch
    Set f = DoRevolve
    If Not f Is Nothing Then f.Name = "DrumShell"
    LogErr "Drum Shell"
    Rebuild
    
    '--------------------------------------------------------------
    ' 2. Drum head (flat circular face)
    '--------------------------------------------------------------
    SelPlane "Top Plane"
    g_swSkMgr.InsertSketch True
    g_swSkMgr.CreateCircle 0, 0, 0, ro, 0, 0
    EndSketch
    Set f = DoExtrude(m(DHT))
    If Not f Is Nothing Then f.Name = "DrumHead"
    LogErr "Drum Head"
    Rebuild
    
    '--------------------------------------------------------------
    ' 3. Mounting bracket
    '--------------------------------------------------------------
    ' Bracket behind drum
    SelPlane "Front Plane"
    g_swSkMgr.InsertSketch True
    g_swSkMgr.CreateCornerRectangle m(-40), m(-20), 0, m(40), m(20), 0
    EndSketch
    Set f = DoExtrude(m(6))
    If Not f Is Nothing Then f.Name = "MountBracket"
    LogErr "Mount Bracket"
    Rebuild
    
    ' M6 holes
    SelPlane "Top Plane"
    g_swSkMgr.InsertSketch True
    g_swSkMgr.CreateCircle m(-30), m(-12), 0, m(-27), m(-12), 0
    g_swSkMgr.CreateCircle m(30), m(-12), 0, m(33), m(-12), 0
    g_swSkMgr.CreateCircle m(-30), m(12), 0, m(-27), m(12), 0
    g_swSkMgr.CreateCircle m(30), m(12), 0, m(33), m(12), 0
    EndSketch
    Set f = DoCutThru
    If Not f Is Nothing Then f.Name = "Bracket_M6Holes"
    LogErr "Bracket Holes"
    Rebuild
    
    '--------------------------------------------------------------
    ' 4. Solenoid + Mallet arm
    '--------------------------------------------------------------
    ' Arm rod
    SelPlane "Front Plane"
    g_swSkMgr.InsertSketch True
    g_swSkMgr.CreateCircle m(60), 0, 0, m(66), 0, 0
    EndSketch
    Set f = DoExtrudeMid(m(12))
    If Not f Is Nothing Then f.Name = "SolenoidArm"
    LogErr "Solenoid Arm"
    Rebuild
    
    ' Mallet head (sphere) - semicircle from (185,0) to (210,0) through (197.5,12.5)
    ' Center at (197.5, 0), radius 12.5, CCW direction
    SelPlane "Front Plane"
    g_swSkMgr.InsertSketch True
    g_swSkMgr.CreateCenterline m(60 + 150 - 12.5), -m(12.5), 0, _
        m(60 + 150 - 12.5), m(12.5), 0
    g_swSkMgr.CreateArc _
        m(60 + 150 - 12.5), 0#, 0#, _
        m(60 + 150 - 25), 0#, 0#, _
        m(60 + 150), 0#, 0#, _
        1
    EndSketch
    Set f = DoRevolve
    If Not f Is Nothing Then f.Name = "MalletHead"
    LogErr "Mallet Head"
    Rebuild
    
    ' Solenoid body
    SelPlane "Front Plane"
    g_swSkMgr.InsertSketch True
    g_swSkMgr.CreateCornerRectangle m(-20), m(-15), 0, m(20), m(15), 0
    EndSketch
    Set f = DoExtrudeMid(m(30))
    If Not f Is Nothing Then f.Name = "SolenoidBody"
    LogErr "Solenoid Body"
    Rebuild
    
    SaveDoc "DrumModule.SLDPRT"
    ' Keep part open
    Debug.Print "Drum Module complete"
End Sub

'====================================================================
' MODULE 3: HEART MODEL
'====================================================================
Sub CreateHeartModel()
    Debug.Print "=== Building Heart Model ==="
    
    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    If fso.FileExists(PROJ_PATH & "HeartModel.SLDPRT") Then
        Debug.Print "Heart model exists, skipping"
        Exit Sub
    End If
    
    If Not NewPart Then Exit Sub
    
    Dim f As Object
    
    '--------------------------------------------------------------
    ' 1. Heart body (spline + mid-plane extrude)
    '--------------------------------------------------------------
    StartSketch "Front Plane"
    
    Dim hp As Variant
    hp = Array( _
        0, 0, 0, _
        m(-20), m(25), 0, _
        m(-42), m(50), 0, _
        m(-35), m(75), 0, _
        0, m(60), 0, _
        m(35), m(75), 0, _
        m(42), m(50), 0, _
        m(20), m(25), 0, _
        0, 0, 0)
    
    Dim swSp As SldWorks.SketchSegment
    Set swSp = g_swSkMgr.CreateSpline(hp)
    If swSp Is Nothing Then LogErr "Heart Spline"
    EndSketch
    
    Set f = DoExtrudeMid(m(HDp))
    If Not f Is Nothing Then f.Name = "HeartBody"
    LogErr "Heart Body"
    Rebuild
    
    '--------------------------------------------------------------
    ' 2. Dome (revolved hemisphere, 3mm wall)
    '--------------------------------------------------------------
    StartSketch "Front Plane"
    Dim rDom As Double
    rDom = m(DMD / 2)
    g_swSkMgr.CreateCenterline 0, 0, 0, 0, rDom, 0
    ' Quarter-circle arc: center at origin, from (rDom,0) to (0,rDom), CCW
    g_swSkMgr.CreateArc _
        0#, 0#, 0#, _
        rDom, 0#, 0#, _
        0#, rDom, 0#, _
        1
    EndSketch
    Set f = DoRevolve
    If Not f Is Nothing Then f.Name = "Dome"
    LogErr "Dome"
    Rebuild
    
    ' Shell dome (3mm inward) - skipped for reliability, add manually if needed
    Debug.Print "  NOTE: Dome shell skipped - apply Shell feature manually (3mm, inward)"
    Rebuild
    
    '--------------------------------------------------------------
    ' 3. Servo bodies
    '--------------------------------------------------------------
    StartSketch "Front Plane"
    g_swSkMgr.CreateCornerRectangle _
        m(-HW / 2 - 12), m(-SERVO_H / 2), 0, _
        m(-HW / 2 - 12 + SERVO_W), m(SERVO_H / 2), 0
    EndSketch
    Set f = DoExtrudeMid(m(SERVO_D))
    If Not f Is Nothing Then f.Name = "LeftServo"
    LogErr "Left Servo"
    Rebuild
    
    StartSketch "Front Plane"
    g_swSkMgr.CreateCornerRectangle _
        m(HW / 2 + 12 - SERVO_W), m(-SERVO_H / 2), 0, _
        m(HW / 2 + 12), m(SERVO_H / 2), 0
    EndSketch
    Set f = DoExtrudeMid(m(SERVO_D))
    If Not f Is Nothing Then f.Name = "RightServo"
    LogErr "Right Servo"
    Rebuild
    
    '--------------------------------------------------------------
    ' 4. Linkage arms
    '--------------------------------------------------------------
    StartSketch "Front Plane"
    g_swSkMgr.CreateCornerRectangle _
        m(-HW / 2 - 12), m(-LINKAGE_T / 2), 0, _
        m(-HW / 2 - 12 + LINKAGE_L), m(LINKAGE_T / 2), 0
    EndSketch
    Set f = DoExtrudeMid(m(LINKAGE_T))
    If Not f Is Nothing Then f.Name = "LeftLinkage"
    LogErr "Left Linkage"
    Rebuild
    
    StartSketch "Front Plane"
    g_swSkMgr.CreateCornerRectangle _
        m(HW / 2 + 12 - LINKAGE_L), m(-LINKAGE_T / 2), 0, _
        m(HW / 2 + 12), m(LINKAGE_T / 2), 0
    EndSketch
    Set f = DoExtrudeMid(m(LINKAGE_T))
    If Not f Is Nothing Then f.Name = "RightLinkage"
    LogErr "Right Linkage"
    Rebuild
    
    '--------------------------------------------------------------
    ' 5. Mount plate
    '--------------------------------------------------------------
    StartSketch "Front Plane"
    g_swSkMgr.CreateCornerRectangle m(-80), m(-30), 0, m(80), m(30), 0
    EndSketch
    Set f = DoExtrudeMid(m(3))
    If Not f Is Nothing Then f.Name = "HeartMountPlate"
    LogErr "Mount Plate"
    Rebuild
    
    SaveDoc "HeartModel.SLDPRT"
    ' Keep part open
    Debug.Print "Heart Model complete"
End Sub

'====================================================================
' MODULE 4: WEIGHT PLATFORM
'====================================================================
Sub CreateWeightPlatform()
    Debug.Print "=== Building Weight Platform ==="
    
    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    If fso.FileExists(PROJ_PATH & "WeightPlatform.SLDPRT") Then
        Debug.Print "Weight platform exists, skipping"
        Exit Sub
    End If
    
    If Not NewPart Then Exit Sub
    
    Dim f As Object
    Dim pfName As String
    
    '--------------------------------------------------------------
    ' 1. Outer shell
    '--------------------------------------------------------------
    StartSketch "Top Plane"
    g_swSkMgr.CreateCornerRectangle _
        m(-PW / 2), m(-PDim / 2), 0, _
        m(PW / 2), m(PDim / 2), 0
    EndSketch
    Set f = DoExtrude(m(PH))
    If Not f Is Nothing Then f.Name = "PlatformBody"
    LogErr "Platform Body"
    Rebuild
    
    ' Shell - skipped for reliability, apply Shell feature manually (3mm wall)
    Debug.Print "  NOTE: Platform shell skipped - apply Shell feature manually (3mm)"
    Rebuild
    
    '--------------------------------------------------------------
    ' 2. Anti-slip rubber mat (top surface)
    '--------------------------------------------------------------
    pfName = CreateOffsetPlane("Top Plane", m(PH))
    StartSketch pfName
    g_swSkMgr.CreateCornerRectangle _
        m(-PW / 2 + 2), m(-PDim / 2 + 2), 0, _
        m(PW / 2 - 2), m(PDim / 2 - 2), 0
    EndSketch
    Set f = DoExtrudeRev(m(PMT))
    If Not f Is Nothing Then f.Name = "AntiSlipMat"
    LogErr "Anti-slip Mat"
    Rebuild
    
    '--------------------------------------------------------------
    ' 3. Load cell recess
    '--------------------------------------------------------------
    StartSketch "Top Plane"
    g_swSkMgr.CreateCornerRectangle _
        m(-50), m(-10), 0, _
        m(50), m(10), 0
    EndSketch
    Set f = DoCut(m(15))
    If Not f Is Nothing Then f.Name = "LoadCellRecess"
    LogErr "Load Cell Recess"
    Rebuild
    
    '--------------------------------------------------------------
    ' 4. Cable conduit (cylindrical cutout)
    '--------------------------------------------------------------
    SelPlane "Right Plane"
    g_swSkMgr.InsertSketch True
    g_swSkMgr.CreateCircle m(-PDim / 2 + 10), m(PH / 2), 0, _
        m(-PDim / 2 + 20), m(PH / 2), 0
    EndSketch
    Set f = DoCutThru
    If Not f Is Nothing Then f.Name = "CableConduit"
    LogErr "Cable Conduit"
    Rebuild
    
    SaveDoc "WeightPlatform.SLDPRT"
    ' Keep part open
    Debug.Print "Weight Platform complete"
End Sub

'====================================================================
' MODULE 5: DISPLAY BEZEL
'====================================================================
Sub CreateDisplayBezel()
    Debug.Print "=== Building Display Bezel ==="
    
    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    If fso.FileExists(PROJ_PATH & "DisplayBezel.SLDPRT") Then
        Debug.Print "Display bezel exists, skipping"
        Exit Sub
    End If
    
    If Not NewPart Then Exit Sub
    
    Dim f As Object
    Dim pfName As String
    
    '--------------------------------------------------------------
    ' 1. Bezel frame (ring shape on Front Plane, extrude Z)
    '--------------------------------------------------------------
    Dim bzW As Double
    Dim bzH As Double
    Dim bzInnerW As Double
    Dim bzInnerH As Double
    bzW = m(DW + 10)
    bzH = m(DH + 10)
    bzInnerW = m(DW - 2)
    bzInnerH = m(DH - 2)
    
    StartSketch "Front Plane"
    g_swSkMgr.CreateCornerRectangle -bzW / 2, -bzH / 2, 0, bzW / 2, bzH / 2, 0
    g_swSkMgr.CreateCornerRectangle -bzInnerW / 2, -bzInnerH / 2, 0, bzInnerW / 2, bzInnerH / 2, 0
    EndSketch
    Set f = DoExtrude(m(5))
    If Not f Is Nothing Then f.Name = "BezelFrame"
    LogErr "Bezel Frame"
    Rebuild
    
    '--------------------------------------------------------------
    ' 2. Screen glass (behind bezel)
    '--------------------------------------------------------------
    pfName = CreateOffsetPlane("Front Plane", m(5))
    StartSketch pfName
    g_swSkMgr.CreateCornerRectangle -bzInnerW / 2, -bzInnerH / 2, 0, bzInnerW / 2, bzInnerH / 2, 0
    EndSketch
    Set f = DoExtrude(m(3))
    If Not f Is Nothing Then f.Name = "ScreenGlass"
    LogErr "Screen Glass"
    Rebuild
    
    '--------------------------------------------------------------
    ' 3. VESA mount bosses (on bezel rear, extrude -Z)
    '--------------------------------------------------------------
    ' Create plane at the rear of the bezel + glass
    pfName = CreateOffsetPlane("Front Plane", m(5 + 3))
    StartSketch pfName
    Dim vHalf As Double
    vHalf = m(75) / 2
    g_swSkMgr.CreateCircle -vHalf, -vHalf, 0, -vHalf + m(0.002), -vHalf, 0
    g_swSkMgr.CreateCircle vHalf, -vHalf, 0, vHalf + m(0.002), -vHalf, 0
    g_swSkMgr.CreateCircle -vHalf, vHalf, 0, -vHalf + m(0.002), vHalf, 0
    g_swSkMgr.CreateCircle vHalf, vHalf, 0, vHalf + m(0.002), vHalf, 0
    EndSketch
    Set f = DoExtrudeRev(m(4))   ' extrude in -Z (toward tower interior)
    If Not f Is Nothing Then f.Name = "VESAMountBosses"
    LogErr "VESA Mount Bosses"
    Rebuild
    
    SaveDoc "DisplayBezel.SLDPRT"
    ' Keep part open
    Debug.Print "Display Bezel complete"
End Sub

'====================================================================
' MODULE 6: ASSEMBLY
'====================================================================
Sub AssembleAll()
    Debug.Print "=== Assembling Kiosk ==="

    ' Initialize
    On Error Resume Next
    Set g_swApp = Application.SldWorks
    On Error GoTo 0
    If g_swApp Is Nothing Then
        MsgBox "Cannot access SolidWorks.", vbCritical: Exit Sub
    End If

    ' Close any open part docs so files can be deleted
    On Error Resume Next
    Dim closeNames As Variant
    closeNames = Array("KioskTower.SLDPRT", "DrumModule.SLDPRT", "HeartModel.SLDPRT", _
                       "WeightPlatform.SLDPRT", "DisplayBezel.SLDPRT", "KioskAssembly.SLDASM")
    Dim ci2 As Long
    For ci2 = 0 To UBound(closeNames)
        g_swApp.CloseDoc closeNames(ci2)
    Next ci2
    On Error GoTo 0

    ' Force delete old parts so they rebuild with current dimensions
    Dim fso2 As Object
    Set fso2 = CreateObject("Scripting.FileSystemObject")
    Dim partNames As Variant
    partNames = Array("KioskTower.SLDPRT", "DrumModule.SLDPRT", "HeartModel.SLDPRT", _
                      "WeightPlatform.SLDPRT", "DisplayBezel.SLDPRT")
    Dim pi As Long
    For pi = 0 To UBound(partNames)
        If fso2.FileExists(PROJ_PATH & partNames(pi)) Then
            fso2.DeleteFile PROJ_PATH & partNames(pi), True
            Debug.Print "  Deleted old: " & partNames(pi)
        End If
    Next pi

    CreateKioskTower
    CreateDrumModule
    CreateHeartModel
    CreateWeightPlatform
    CreateDisplayBezel
    Debug.Print "  All parts recreated"

    If Not NewAssembly Then Exit Sub

    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    Dim parts As Variant
    parts = Array("KioskTower.SLDPRT", "DrumModule.SLDPRT", "HeartModel.SLDPRT", _
                  "WeightPlatform.SLDPRT", "DisplayBezel.SLDPRT")
    Dim i As Long
    For i = 0 To UBound(parts)
        If Not fso.FileExists(PROJ_PATH & parts(i)) Then
            MsgBox "Missing part: " & parts(i), vbCritical: Exit Sub
        End If
    Next i

    ' Get assembly name for plane selection (strip extension)
    Dim assyTitle As String
    assyTitle = g_swModel.GetTitle
    If InStr(assyTitle, ".") > 0 Then assyTitle = Left(assyTitle, InStr(assyTitle, ".") - 1)
    Debug.Print "  Assembly name: " & assyTitle

    Dim compTower As Object
    Dim compDrum As Object
    Dim compHeart As Object
    Dim compPlatform As Object
    Dim compBezel As Object

    ' --- Add components ---
    Set compTower = g_swAssy.AddComponent5(PROJ_PATH & "KioskTower.SLDPRT", 0, "", False, "", 0, 0, 0)
    If compTower Is Nothing Then
        Debug.Print "  ERR: Tower"
    Else
        On Error Resume Next
        compTower.Fixed = True
        On Error GoTo 0
        Debug.Print "  Tower added: " & compTower.Name2
    End If
    Rebuild

    Set compDrum = g_swAssy.AddComponent5(PROJ_PATH & "DrumModule.SLDPRT", 0, "", False, "", 0, m(TH), 0)
    If compDrum Is Nothing Then
        Debug.Print "  ERR: Drum"
    Else
        Debug.Print "  Drum added: " & compDrum.Name2
    End If
    Rebuild

    Set compHeart = g_swAssy.AddComponent5(PROJ_PATH & "HeartModel.SLDPRT", 0, "", False, "", _
        0, m(TH + DDe / 2), m(DDe / 2 + 20))
    If compHeart Is Nothing Then
        Debug.Print "  ERR: Heart"
    Else
        Debug.Print "  Heart added: " & compHeart.Name2
    End If
    Rebuild

    Set compPlatform = g_swAssy.AddComponent5(PROJ_PATH & "WeightPlatform.SLDPRT", 0, "", False, "", _
        0, 0, m(TD / 2 + 300))
    If compPlatform Is Nothing Then
        Debug.Print "  ERR: Platform"
    Else
        Debug.Print "  Platform added: " & compPlatform.Name2
    End If
    Rebuild

    Set compBezel = g_swAssy.AddComponent5(PROJ_PATH & "DisplayBezel.SLDPRT", 0, "", False, "", _
        0, m(DY), m(TD / 2 + 5))
    If compBezel Is Nothing Then
        Debug.Print "  ERR: Bezel"
    Else
        Debug.Print "  Bezel added: " & compBezel.Name2
    End If
    Rebuild

    ' --- List available planes on each component ---
    Debug.Print ""
    Debug.Print "--- Enumerating component planes ---"
    Dim vComps As Variant
    vComps = g_swAssy.GetComponents(False)
    Dim ci As Long
    For ci = 0 To UBound(vComps)
        Dim swComp As Object
        Set swComp = vComps(ci)
        Debug.Print "  Component: " & swComp.Name2
        Dim swCompModel As Object
        Set swCompModel = swComp.GetModelDoc2
        If Not swCompModel Is Nothing Then
            Dim swFeat As Object
            Set swFeat = swCompModel.FirstFeature
            Do While Not swFeat Is Nothing
                If swFeat.GetTypeName2 = "ReferencePlane" Then
                    Debug.Print "    Plane: " & swFeat.Name
                End If
                Set swFeat = swFeat.GetNextFeature
            Loop
        Else
            Debug.Print "    WARN: Cannot get model doc"
        End If
    Next ci
    Debug.Print "--- End plane enumeration ---"
    Debug.Print ""

    ' --- Create mates using CreateMate (SW 2026 API) ---
    Dim mateCount As Long
    mateCount = 0

    ' Mate 1: Tower Right Plane = Drum Right Plane (center on X)
    If MatePlaneComp(compTower.Name2, "Right Plane", _
                     compDrum.Name2, "Right Plane", assyTitle) Then
        mateCount = mateCount + 1
    End If

    ' Mate 2: Tower Front Plane = Drum Front Plane (center on Z)
    If MatePlaneComp(compTower.Name2, "Front Plane", _
                     compDrum.Name2, "Front Plane", assyTitle) Then
        mateCount = mateCount + 1
    End If

    ' Mate 3: Tower Right Plane = Bezel Right Plane (center on X)
    If MatePlaneComp(compTower.Name2, "Right Plane", _
                     compBezel.Name2, "Right Plane", assyTitle) Then
        mateCount = mateCount + 1
    End If

    ' Mate 4: Tower Right Plane = Platform Right Plane (center on X)
    If MatePlaneComp(compTower.Name2, "Right Plane", _
                     compPlatform.Name2, "Right Plane", assyTitle) Then
        mateCount = mateCount + 1
    End If

    Debug.Print ""
    Debug.Print "  Total mates created: " & mateCount

    g_swModel.ForceRebuild3 True
    g_swModel.ViewZoomtofit

    SaveDoc "KioskAssembly.SLDASM"
    Debug.Print "Assembly complete"
End Sub

Private Function MatePlaneComp(compAName As String, planeA As String, _
                                compBName As String, planeB As String, _
                                assyName As String) As Boolean
    MatePlaneComp = False

    Dim selA As String, selB As String
    selA = planeA & "@" & compAName & "@" & assyName
    selB = planeB & "@" & compBName & "@" & assyName

    Debug.Print "  Mate: " & selA & "  =  " & selB

    ' Clear
    g_swModel.ClearSelection2 True

    ' Select first entity (mark=1)
    Dim bRet As Boolean
    bRet = g_swModel.Extension.SelectByID2(selA, "PLANE", 0, 0, 0, False, 1, Nothing, 0)
    Debug.Print "    Select A: " & bRet
    If Not bRet Then
        Debug.Print "    FAIL: Could not select " & selA
        Exit Function
    End If

    ' Select second entity (mark=2, append)
    bRet = g_swModel.Extension.SelectByID2(selB, "PLANE", 0, 0, 0, True, 2, Nothing, 0)
    Debug.Print "    Select B: " & bRet
    If Not bRet Then
        Debug.Print "    FAIL: Could not select " & selB
        Exit Function
    End If

    ' CreateMate approach (SW 2026)
    Dim swMateData As Object
    On Error Resume Next
    Set swMateData = g_swAssy.CreateMateData(0)  ' 0 = swMateCOINCIDENT
    On Error GoTo 0
    If swMateData Is Nothing Then
        Debug.Print "    FAIL: CreateMateData returned Nothing"
        Exit Function
    End If

    ' Get selected entities from SelectionManager
    Dim swSelMgr As Object
    Set swSelMgr = g_swModel.SelectionManager
    Dim entA As Object, entB As Object
    Set entA = swSelMgr.GetSelectedObject6(1, -1)
    Set entB = swSelMgr.GetSelectedObject6(2, -1)

    If entA Is Nothing Then
        Debug.Print "    FAIL: GetSelectedObject(1) = Nothing"
        Exit Function
    End If
    If entB Is Nothing Then
        Debug.Print "    FAIL: GetSelectedObject(2) = Nothing"
        Exit Function
    End If
    Debug.Print "    Entity A: " & entA.GetTypeName & " - " & entA.Name
    Debug.Print "    Entity B: " & entB.GetTypeName & " - " & entB.Name

    ' Set entities on mate data
    Dim entities(1) As Object
    Set entities(0) = entA
    Set entities(1) = entB
    swMateData.EntitiesToMate = entities
    swMateData.MateAlignment = 0  ' swMateAlignALIGNED

    ' Create the mate
    Dim swMateFeat As Object
    On Error Resume Next
    Set swMateFeat = g_swAssy.CreateMate(swMateData)
    Dim mateErr As Long: mateErr = Err.Number
    On Error GoTo 0

    If swMateFeat Is Nothing Then
        Debug.Print "    FAIL: CreateMate returned Nothing (err=" & mateErr & ")"
        Exit Function
    End If

    Debug.Print "    OK: Mate created -> " & swMateFeat.Name
    g_swModel.ClearSelection2 True
    MatePlaneComp = True
End Function

'====================================================================
' MODULE 7: RENDERING + APPEARANCES
'====================================================================
Sub SetupRendering()
    Debug.Print "=== Setting up Rendering ==="
    On Error Resume Next
    Set g_swApp = Application.SldWorks
    If g_swApp Is Nothing Then
        MsgBox "Cannot access SolidWorks." & vbCrLf & _
               "Run this macro from within SolidWorks.", vbCritical, "Error"
        End
    End If
    On Error GoTo 0
    ApplyAppearances
    Debug.Print "Rendering complete"
End Sub

Private Sub ApplyAppearances()
    ' Tower - Brushed Aluminum (medium gray-blue, high shine)
    ApplyPartColor PROJ_PATH & "KioskTower.SLDPRT", _
        0.4, 0.4, 0.45, 0.7, 0.0

    ' Drum - Cherry Wood (warm brown, moderate shine)
    ApplyPartColor PROJ_PATH & "DrumModule.SLDPRT", _
        0.54, 0.27, 0.07, 0.3, 0.0

    ' Heart - Red Translucent (bright red, slight transparency)
    ApplyPartColor PROJ_PATH & "HeartModel.SLDPRT", _
        0.9, 0.05, 0.05, 0.5, 0.15

    ' Platform - Black Rubber (near-black, matte)
    ApplyPartColor PROJ_PATH & "WeightPlatform.SLDPRT", _
        0.05, 0.05, 0.05, 0.05, 0.0

    ' Bezel - Frosted Acrylic Dark (dark charcoal blue, slight transparency)
    ApplyPartColor PROJ_PATH & "DisplayBezel.SLDPRT", _
        0.1, 0.1, 0.15, 0.15, 0.05

    MsgBox "Basic colors applied to all 5 parts." & vbCrLf & _
           "For realistic materials (wood grain, brushed metal, etc.)," & vbCrLf & _
           "right-click each part in the assembly and set manually.", _
           vbInformation, "Appearances Applied"
End Sub

Private Sub ApplyPartColor(ByVal path As String, _
    ByVal r As Double, ByVal g As Double, ByVal b As Double, _
    ByVal shininess As Double, ByVal transparency As Double)

    Dim swDoc As SldWorks.ModelDoc2
    Dim errors As Long
    Dim matProps(11) As Double

    Dim weOpened As Boolean
    weOpened = False

    ' Try to get already-open document first (e.g. referenced by open assembly)
    Set swDoc = g_swApp.GetOpenDocumentByName(path)
    If swDoc Is Nothing Then
        On Error Resume Next
        Set swDoc = g_swApp.OpenDoc6(path, 1, 0, "", errors, 1)
        If swDoc Is Nothing Then
            On Error GoTo 0
            Debug.Print "  Could not open: " & path
            Exit Sub
        End If
        On Error GoTo 0
        weOpened = True
    End If

    matProps(0) = r: matProps(1) = g: matProps(2) = b   ' Ambient
    matProps(3) = r: matProps(4) = g: matProps(5) = b   ' Diffuse
    matProps(6) = 1: matProps(7) = 1: matProps(8) = 1   ' Specular
    matProps(9) = shininess
    matProps(10) = transparency
    matProps(11) = 0                                     ' Emission

    On Error Resume Next
    CallByName swDoc, "MaterialPropertyValues", VbLet, matProps
    If Err.Number <> 0 Then
        Debug.Print "  MaterialPropertyValues failed: " & Err.Description
        Err.Clear
    End If
    On Error GoTo 0

    ' Save using late binding (consistent with SaveDoc)
    CallByName swDoc, "SaveAs3", VbMethod, path, CLng(0), CLng(0)
    If Err.Number <> 0 Then
        Err.Clear
        CallByName swDoc, "SaveAs", VbMethod, path, CLng(0), CLng(0)
    End If

    ' Close only if we opened it (leave already-open docs alone)
    If weOpened Then
        g_swApp.CloseDoc swDoc.GetTitle
    End If

    Debug.Print "  Colored: " & path
End Sub

'====================================================================
' MODULE 8: DRAWING CREATION (2D ENGINEERING DRAWING)
'====================================================================
Function GetDrawTemplate() As String
    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    Dim p As String

    p = "C:\ProgramData\SolidWorks\SOLIDWORKS 2026\templates\Drawing.DRWDOT"
    If fso.FileExists(p) Then GetDrawTemplate = p: Exit Function

    p = "C:\ProgramData\SolidWorks\SOLIDWORKS 2026\templates\MBD\Drawing.DRWDOT"
    If fso.FileExists(p) Then GetDrawTemplate = p: Exit Function

    On Error Resume Next
    GetDrawTemplate = g_swApp.GetUserPreferenceStringValue(swUserPreferenceStringValue_e.swDefaultTemplateDrawing)
    On Error GoTo 0
End Function

Sub CreateDrawing()
    Debug.Print "=== Creating 2D Drawing ==="

    On Error Resume Next
    Set g_swApp = Application.SldWorks
    On Error GoTo 0
    If g_swApp Is Nothing Then
        MsgBox "Cannot access SolidWorks.", vbCritical: Exit Sub
    End If

    Dim drawTmpl As String
    drawTmpl = GetDrawTemplate()
    If drawTmpl = "" Then
        MsgBox "No drawing template found." & vbCrLf & _
               "Checked: C:\ProgramData\SolidWorks\SOLIDWORKS 2026\templates\", _
               vbCritical, "Template Error"
        Exit Sub
    End If
    Debug.Print "  Drawing template: " & drawTmpl

    Dim assyPath As String
    assyPath = PROJ_PATH & "KioskAssembly.SLDASM"
    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    If Not fso.FileExists(assyPath) Then
        MsgBox "Assembly not found: " & assyPath, vbCritical, "Error"
        Exit Sub
    End If

    Dim swDraw As Object
    Set swDraw = g_swApp.NewDocument(drawTmpl, 0, 0, 0)
    If swDraw Is Nothing Then
        MsgBox "Failed to create drawing.", vbCritical: Exit Sub
    End If
    Debug.Print "  Drawing document created"

    Dim swDrawDoc As Object
    Set swDrawDoc = swDraw

    Dim v As Object
    Dim errNum As Long

    ' --- Front view (base view) ---
    On Error Resume Next
    Err.Clear
    Set v = swDrawDoc.CreateNewView( _
        assyPath, CLng(0), CLng(3), True, CDbl(1), CDbl(1))
    errNum = Err.Number: Err.Clear
    On Error GoTo 0
    If errNum = 0 And Not v Is Nothing Then
        Debug.Print "  Front view OK"
    Else
        Debug.Print "  Front view: err=" & errNum & " (try manually)"
    End If

    ' --- Top view ---
    Set v = Nothing
    On Error Resume Next
    Err.Clear
    Set v = swDrawDoc.CreateNewView( _
        assyPath, CLng(1), CLng(3), True, CDbl(1), CDbl(1))
    errNum = Err.Number: Err.Clear
    On Error GoTo 0
    If errNum = 0 And Not v Is Nothing Then
        Debug.Print "  Top view OK"
    Else
        Debug.Print "  Top view: err=" & errNum
    End If

    ' --- Right view ---
    Set v = Nothing
    On Error Resume Next
    Err.Clear
    Set v = swDrawDoc.CreateNewView( _
        assyPath, CLng(2), CLng(3), True, CDbl(1), CDbl(1))
    errNum = Err.Number: Err.Clear
    On Error GoTo 0
    If errNum = 0 And Not v Is Nothing Then
        Debug.Print "  Right view OK"
    Else
        Debug.Print "  Right view: err=" & errNum
    End If

    ' --- Isometric view ---
    Set v = Nothing
    On Error Resume Next
    Err.Clear
    Set v = swDrawDoc.CreateNewView( _
        assyPath, CLng(6), CLng(3), True, CDbl(1), CDbl(1))
    errNum = Err.Number: Err.Clear
    On Error GoTo 0
    If errNum = 0 And Not v Is Nothing Then
        Debug.Print "  Iso view OK"
    Else
        Debug.Print "  Iso view: err=" & errNum
    End If

    ' --- Section view ---
    On Error Resume Next
    Err.Clear
    CallByName swDrawDoc, "CreateSectionView", VbMethod, _
        CDbl(m(350)), CDbl(m(400)), CDbl(0), CDbl(0), CDbl(0), _
        "Section A-A", CLng(0), CDbl(0), CDbl(0), False, CLng(0)
    errNum = Err.Number: Err.Clear
    On Error GoTo 0
    If errNum = 0 Then
        Debug.Print "  Section view OK"
    Else
        Debug.Print "  Section view: err=" & errNum
    End If

    On Error Resume Next
    swDraw.ViewZoomtofit2
    On Error GoTo 0

    CallByName swDraw, "SaveAs3", VbMethod, _
        PROJ_PATH & "KioskAssembly.SLDDRW", CLng(0), CLng(0)

    Debug.Print "  Drawing saved: " & PROJ_PATH & "KioskAssembly.SLDDRW"
    Debug.Print "Drawing complete"
End Sub
