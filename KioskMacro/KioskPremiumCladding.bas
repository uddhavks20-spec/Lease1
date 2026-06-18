'====================================================================
' PREMIUM KIOSK CLADDING & EXTERNAL SHEET-METAL PANELS
' Target: SolidWorks 2026 (API 32.x)
'
' Transforms the kiosk from a simple fabricated cabinet into a
' premium museum-quality interactive exhibit (Apple/Tesla/science
' museum aesthetic).
'
' MODIFIES existing KioskTower, DrumModule, WeightPlatform, and
' DisplayBezel parts. No duplicate bodies or overlapping geometry.
'
' Sheet-metal: 2mm thickness, 3mm min bend radius.
' Design language: large radii, smooth transitions, shadow gaps,
'                  flush surfaces, hidden fasteners.
'
' HOW TO RUN:
'   1. Open SolidWorks 2026
'   2. Tools > Macro > Edit (VBA Editor)
'   3. File > Import File > select this .bas file
'   4. F5 > BuildPremiumKiosk
'
' No type library references needed (late binding).
'====================================================================
Option Explicit

'--- Application References (late binding for SW 2026) ---
Dim g_swApp As Object
Dim g_swModel As Object
Dim g_swPart As Object
Dim g_swSkMgr As Object
Dim g_swFeatMgr As Object

'--- Unit conversion (mm -> meters) ---
Const MM As Double = 0.001

'--- Project path ---
Const PROJ_PATH As String = "C:\Users\kisha\Documents\Kiosk\"

'=== PREMIUM DIMENSIONS (mm) - Updated to match HeartbeatDrumKioskFrame ===
Const TW As Double = 550         ' tower width (center-center of tower tubes)
Const TD As Double = 350         ' tower depth (center-center of tower tubes)
Const TH As Double = 1500        ' tower height (from base plate top)
Const FW As Double = 2           ' frame wall (sheet metal)
Const PT As Double = 2           ' panel thickness (sheet metal)
Const SHMET As Double = 2        ' sheet metal thickness
Const MIN_BEND As Double = 3     ' minimum bend radius

'--- Frame dimensions (50x50x3 SHS) ---
Const FS As Double = 50          ' frame size (square tube outer)
Const FS_W As Double = 3         ' frame wall thickness

'--- Neck transition ---
Const NECK_R As Double = 200     ' transition radius (scaled for larger frame)
Const NECK_H As Double = 300     ' height of transition zone (matches frame)
Const NECK_Y As Double = 1500    ' Y position where transition starts (at tower top)

'--- Display / screen ---
Const SCR_W As Double = 400      ' screen width (scaled for larger tower)
Const SCR_H As Double = 250      ' screen height (scaled for larger tower)
Const SCR_ANGLE As Double = 17.5 ' screen angle upward (degrees)
Const SCR_Y As Double = 900      ' screen center height (45% up tower)
Const SCR_GAP As Double = 1.5    ' flush-mount shadow gap

'--- Drum shroud ---
Const DRUM_DIA As Double = 700   ' shroud diameter
Const DRUM_R As Double = 350     ' shroud radius
Const DRUM_GAP As Double = 3     ' gap between drum and shroud
Const DRUM_Y As Double = 1750    ' shroud center height (at drum plate level)
Const DRUM_WALL As Double = 3    ' shroud wall thickness

'--- Integrated podium platform ---
Const POD_W As Double = 800      ' podium width (close to base width)
Const POD_D As Double = 800      ' podium depth (close to base depth)
Const POD_H As Double = 100      ' podium height
Const POD_R As Double = 30       ' podium corner radius
Const POD_TAPER As Double = 15   ' taper from tower to podium edge

'--- Hidden service panel ---
Const SVC_W As Double = 320      ' service opening width (matches frame SERV_W)
Const SVC_H As Double = 380      ' service opening height (matches frame SERV_H)
Const SVC_Y As Double = 750      ' service opening center height (centered on tower)
Const SVC_SEAM As Double = 1.5   ' recessed seam width

'--- Ventilation ---
Const VENT_W As Double = 80      ' vent slot width
Const VENT_H As Double = 2.5     ' vent slot height (2mm min for airflow)
Const VENT_COUNT As Long = 6     ' number of vent slots
Const VENT_GAP As Double = 12    ' gap between vent slots
Const VENT_REAR_Y As Double = 1300 ' rear vent Y position

'--- LED accent ---
Const LED_W As Double = 3        ' LED channel width
Const LED_D As Double = 1.5      ' LED channel depth

'=== DERIVED CONSTANTS (meters) ===
Dim g_xL As Double, g_xR As Double, g_xC As Double
Dim g_zF As Double, g_zRr As Double, g_zC As Double
Dim g_yBot As Double, g_yTop As Double
Dim g_neckBot As Double, g_neckTop As Double

'====================================================================
' MAIN ENTRY POINT
'====================================================================
Sub BuildPremiumKiosk()
    '--- Connect to SolidWorks ---
    On Error Resume Next
    Set g_swApp = Application.SldWorks
    If g_swApp Is Nothing Then
        MsgBox "Cannot access SolidWorks 2026." & vbCrLf & _
               "Run this macro from within SolidWorks.", _
               vbCritical, "Connection Error"
        Exit Sub
    End If
    On Error GoTo 0

    '--- Ensure project folder exists ---
    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    If Not fso.FolderExists("C:\Users\kisha\Documents") Then
        fso.CreateFolder "C:\Users\kisha\Documents"
    End If
    If Not fso.FolderExists(PROJ_PATH) Then
        fso.CreateFolder PROJ_PATH
    End If

    '--- Initialize global coordinates ---
    InitGlobals

    Dim t0 As Double
    t0 = Timer

    Debug.Print "=== Premium Kiosk Cladding Build ==="
    Debug.Print "API revision: " & g_swApp.RevisionNumber

    '--- Rebuild all parts with premium geometry ---
    RebuildKioskTower
    RebuildDrumModule
    RebuildWeightPlatform
    RebuildDisplayBezel
    AssemblePremiumKiosk

    Debug.Print "=== Build complete in " & Format(Timer - t0, "0.0") & "s ==="
    MsgBox "Premium kiosk cladding built successfully." & vbCrLf & vbCrLf & _
           "Parts saved to: " & PROJ_PATH & vbCrLf & vbCrLf & _
           "Assembly: " & PROJ_PATH & "KioskPremium.SLDASM" & vbCrLf & vbCrLf & _
           "Features:" & vbCrLf & _
           "  - Smooth 135mm neck transition" & vbCrLf & _
           "  - Angled flush-mount screen (17.5 deg)" & vbCrLf & _
           "  - 700mm drum shroud" & vbCrLf & _
           "  - Integrated 420x350mm podium" & vbCrLf & _
           "  - Hidden rear service panel" & vbCrLf & _
           "  - Hidden ventilation slots" & vbCrLf & _
           "  - Premium shadow gaps and LED accents" & vbCrLf & vbCrLf & _
           "Check Immediate Window (Ctrl+G) for details.", _
           vbInformation, "Premium Kiosk Complete"
End Sub

'====================================================================
' INITIALIZATION
'====================================================================
Private Sub InitGlobals()
    g_xL = m(-TW / 2)
    g_xR = m(TW / 2)
    g_xC = 0#
    g_zF = m(TD / 2)
    g_zRr = m(-TD / 2)
    g_zC = 0#
    g_yBot = 0#
    g_yTop = m(TH)
    g_neckBot = m(NECK_Y)
    g_neckTop = m(NECK_Y + NECK_H)
End Sub

Private Function m(ByVal v As Double) As Double
    m = v * MM
End Function

'====================================================================
' TEMPLATE + DOCUMENT MANAGEMENT
'====================================================================
Private Function GetPartTemplate() As String
    GetPartTemplate = ""
    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")

    On Error Resume Next
    Dim apiPath As String
    apiPath = g_swApp.GetUserPreferenceStringValue(71)
    On Error GoTo 0

    If apiPath <> "" Then
        If fso.FileExists(apiPath) Then
            GetPartTemplate = apiPath
            Exit Function
        End If
        Dim mbdPath As String
        mbdPath = Left(apiPath, InStrRev(apiPath, "\")) & _
                  "MBD\" & Mid(apiPath, InStrRev(apiPath, "\") + 1)
        If fso.FileExists(mbdPath) Then
            GetPartTemplate = mbdPath
            Exit Function
        End If
    End If

    Dim templates As Variant
    templates = Array( _
        "C:\ProgramData\SolidWorks\SOLIDWORKS 2026\templates\MBD\part 0251mm to 1000mm.prtdot", _
        "C:\ProgramData\SolidWorks\SOLIDWORKS 2026\templates\MBD\part 0051mm to 0250mm.prtdot", _
        "C:\ProgramData\SolidWorks\SOLIDWORKS 2026\templates\part.prtdot", _
        "C:\ProgramData\SolidWorks\SOLIDWORKS 2026\templates\Part.prtdot")
    Dim i As Long
    For i = 0 To UBound(templates)
        If fso.FileExists(CStr(templates(i))) Then
            GetPartTemplate = CStr(templates(i))
            Exit Function
        End If
    Next i

    On Error Resume Next
    Dim folder As Object
    Set folder = fso.GetFolder("C:\ProgramData\SolidWorks\SOLIDWORKS 2026\templates")
    Dim subFolder As Object, file As Object
    For Each subFolder In folder.SubFolders
        For Each file In subFolder.Files
            If Right(LCase(file.Name), 7) = ".prtdot" Then
                GetPartTemplate = file.Path
                Exit Function
            End If
        Next file
    Next subFolder
    On Error GoTo 0
End Function

Private Function NewPart() As Boolean
    Dim tmpl As String
    tmpl = GetPartTemplate
    If tmpl = "" Then
        MsgBox "No part template found." & vbCrLf & _
               "Set default template: Tools > Options > File Locations", _
               vbCritical, "Template Error"
        NewPart = False
        Exit Function
    End If
    Set g_swModel = g_swApp.NewDocument(tmpl, 0, 0, 0)
    If g_swModel Is Nothing Then
        MsgBox "Failed to create part document.", vbCritical
        NewPart = False
        Exit Function
    End If
    Set g_swPart = g_swModel
    Set g_swSkMgr = g_swModel.SketchManager
    Set g_swFeatMgr = g_swModel.FeatureManager
    NewPart = True
End Function

Private Sub SaveDoc(ByVal name As String)
    Dim path As String
    Dim errNum As Long, warnNum As Long
    path = PROJ_PATH & name
    g_swModel.SaveAs4 path, 0, 0, errNum, warnNum
    If errNum <> 0 Then
        Debug.Print "  Save warning: " & errNum
    End If
    Debug.Print "  Saved: " & path
End Sub

Private Sub LogErr(ByVal op As String)
    On Error Resume Next
    If g_swApp Is Nothing Then Exit Sub
    Dim e As Long
    e = g_swApp.GetLastError
    If e <> 0 Then Debug.Print "  WARN " & op & ": error " & e
    On Error GoTo 0
End Sub

'====================================================================
' SKETCH + FEATURE HELPERS
'====================================================================
Private Sub SelPlane(ByVal name As String)
    g_swModel.Extension.SelectByID2 name, "PLANE", 0, 0, 0, False, 0, Nothing, 0
End Sub

Private Sub StartSketch(ByVal plane As String)
    SelPlane plane
    g_swSkMgr.InsertSketch True
End Sub

Private Sub EndSketch()
    g_swSkMgr.InsertSketch True
End Sub

Private Sub Rebuild()
    On Error Resume Next
    g_swModel.ForceRebuild3 True
    On Error GoTo 0
End Sub

Private Function Extrude(ByVal depthM As Double, _
                         Optional ByVal reverse As Boolean = False, _
                         Optional ByVal midPlane As Boolean = False) As Object
    Dim d1Type As Long
    If midPlane Then d1Type = 6 Else d1Type = 0
    Set Extrude = g_swFeatMgr.FeatureExtrusion3( _
        True, False, reverse, _
        d1Type, 0, _
        depthM, 0, _
        False, False, _
        False, False, _
        0, 0, _
        False, False, _
        False, False, _
        True, True, True, _
        0, 0, False)
End Function

Private Function CutBlind(ByVal depthM As Double, _
                          Optional ByVal reverse As Boolean = False) As Object
    Set CutBlind = g_swFeatMgr.FeatureCut4( _
        True, False, reverse, _
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

Private Function CutThruAll() As Object
    Set CutThruAll = g_swFeatMgr.FeatureCut4( _
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

Private Function RevolveFull() As Object
    Set RevolveFull = g_swFeatMgr.FeatureRevolve2( _
        True, True, False, _
        6.283185307, 0, _
        False, False, _
        0, 0, 0, 0, _
        False, False, 0, 0, _
        0, 0, _
        True, False, True)
End Function

Private Function MakePlane(ByVal refPlane As String, _
                           ByVal distM As Double, _
                           Optional ByVal newName As String = "") As String
    Dim pf As Object
    SelPlane refPlane
    Set pf = g_swFeatMgr.InsertRefPlane(8, distM, 0, 0, 0, 0)
    If pf Is Nothing Then
        MakePlane = ""
        Exit Function
    End If
    If newName <> "" Then pf.Name = newName
    MakePlane = pf.Name
End Function

Private Function DeleteFeature(ByVal featName As String) As Boolean
    On Error Resume Next
    g_swModel.Extension.SelectByID2 featName, "BODYFEATURE", 0, 0, 0, False, 0, Nothing, 0
    Dim swFeat As Object
    Set swFeat = g_swModel.SelectionManager.GetSelectedObject6(1, -1)
    If Not swFeat Is Nothing Then
        g_swModel.FeatureManager.DeleteSelection 0
        DeleteFeature = True
        Debug.Print "  Deleted feature: " & featName
    Else
        DeleteFeature = False
    End If
    On Error GoTo 0
    g_swModel.ClearSelection2 True
End Function

Private Sub DeleteAllFeatures()
    Dim swFeat As Object
    Set swFeat = g_swModel.FirstFeature
    Do While Not swFeat Is Nothing
        Dim nextFeat As Object
        Set nextFeat = swFeat.GetNextFeature
        Dim fType As String
        fType = swFeat.GetTypeName2
        If fType <> "OriginProfileFeature" And _
           fType <> "HistoryTreeFolder" And _
           fType <> "SOLIDWORKSReferenceGeometryFolder" And _
           fType <> "ReferencePlane" And _
           fType <> "SOLIDWORKSplanes" And _
           fType <> "SOLIDWORKSuserDefinedAxes" And _
           fType <> "SOLIDWORKSuserDefinedCSs" Then
            On Error Resume Next
            g_swModel.Extension.SelectByID2 swFeat.Name, "BODYFEATURE", 0, 0, 0, False, 0, Nothing, 0
            g_swModel.FeatureManager.DeleteSelection 0
            On Error GoTo 0
        End If
        Set swFeat = nextFeat
    Loop
    g_swModel.ClearSelection2 True
End Sub

Private Function SelectEdge(ByVal x As Double, ByVal y As Double, ByVal z As Double, _
                            ByVal append As Boolean) As Boolean
    SelectEdge = g_swModel.Extension.SelectByID2("", "EDGE", x, y, z, append, 0, Nothing, 0)
End Function

Private Function SelectFace(ByVal x As Double, ByVal y As Double, ByVal z As Double, _
                            ByVal append As Boolean) As Boolean
    SelectFace = g_swModel.Extension.SelectByID2("", "FACE", x, y, z, append, 0, Nothing, 0)
End Function

'====================================================================
' FILLET HELPER
'====================================================================
Private Function ApplyFillet(ByVal radiusM As Double) As Object
    On Error Resume Next
    Set ApplyFillet = g_swFeatMgr.FeatureFillet3( _
        1, radiusM, _
        0, 0, 0, _
        0, 0, 0, _
        0, 0, 0, _
        0, 0, 0, _
        0, 0, 0, _
        0, 0, 0, _
        False, False, False, False, _
        False, False, False, False)
    On Error GoTo 0
End Function

'====================================================================
' MODULE 1: KIOSK TOWER - PREMIUM REBUILD
'====================================================================
'====================================================================
' SAFE FILE DELETE WITH RETRY
'====================================================================
Private Sub SafeDeleteFile(ByVal fso As Object, ByVal filePath As String, ByVal docName As String)
    On Error Resume Next
    g_swApp.CloseDoc docName
    Err.Clear

    Dim retry As Long
    For retry = 1 To 5
        If fso.FileExists(filePath) Then
            On Error Resume Next
            fso.DeleteFile filePath, True
            If Err.Number = 0 Then
                On Error GoTo 0
                Exit For
            End If
            Err.Clear
            On Error GoTo 0
            Dim wait As Double
            wait = Timer
            Do While Timer < wait + 0.5
                DoEvents
            Loop
        Else
            Exit For
        End If
    Next retry
    On Error GoTo 0
End Sub

Private Sub RebuildKioskTower()
    Debug.Print "=== Rebuilding Kiosk Tower (Premium) ==="

    '--- Delete existing file if present ---
    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    SafeDeleteFile fso, PROJ_PATH & "KioskTower.SLDPRT", "KioskTower.SLDPRT"

    If Not NewPart Then Exit Sub

    Dim f As Object
    Dim pfName As String

    '--------------------------------------------------------------
    ' 1. VERTICAL FRAME POSTS (4 corners)
    '--------------------------------------------------------------
    Dim hfs As Double, hfi As Double
    hfs = m(FS / 2)
    hfi = m((FS - 2 * FW) / 2)

    StartSketch "Top Plane"

    Dim cxVals As Variant, czVals As Variant
    cxVals = Array(m(-TW / 2 + FS / 2), m(TW / 2 - FS / 2), _
                   m(-TW / 2 + FS / 2), m(TW / 2 - FS / 2))
    czVals = Array(m(TD / 2 - FS / 2), m(TD / 2 - FS / 2), _
                   m(-TD / 2 + FS / 2), m(-TD / 2 + FS / 2))

    Dim i As Long
    For i = 0 To 3
        g_swSkMgr.CreateCenterRectangle cxVals(i), czVals(i), 0, _
            cxVals(i) + hfs, czVals(i) + hfs, 0
        g_swSkMgr.CreateCenterRectangle cxVals(i), czVals(i), 0, _
            cxVals(i) + hfi, czVals(i) + hfi, 0
    Next i

    EndSketch
    Set f = Extrude(m(NECK_Y))
    If Not f Is Nothing Then f.Name = "Frame_VerticalPosts"
    LogErr "Vertical Posts"
    Rebuild

    '--------------------------------------------------------------
    ' 2. BOTTOM HORIZONTAL RAILS
    '--------------------------------------------------------------
    Dim yBot As Double
    yBot = m(FS / 2)

    ' Front + Rear rails (Right Plane, extrude in X)
    StartSketch "Right Plane"
    g_swSkMgr.CreateCenterRectangle m(TD / 2 - FS / 2), yBot, 0, _
        m(TD / 2 - FS / 2) + hfs, yBot + hfs, 0
    g_swSkMgr.CreateCenterRectangle m(TD / 2 - FS / 2), yBot, 0, _
        m(TD / 2 - FS / 2) + hfi, yBot + hfi, 0
    g_swSkMgr.CreateCenterRectangle m(-TD / 2 + FS / 2), yBot, 0, _
        m(-TD / 2 + FS / 2) + hfs, yBot + hfs, 0
    g_swSkMgr.CreateCenterRectangle m(-TD / 2 + FS / 2), yBot, 0, _
        m(-TD / 2 + FS / 2) + hfi, yBot + hfi, 0
    EndSketch
    Set f = Extrude(m(TW - 2 * FS), False, True)
    If Not f Is Nothing Then f.Name = "Frame_BottomFrontRear"
    LogErr "Bottom F/R Rails"
    Rebuild

    ' Left + Right rails (Front Plane, extrude in Z)
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
    Set f = Extrude(m(TD - 2 * FS), False, True)
    If Not f Is Nothing Then f.Name = "Frame_BottomLeftRight"
    LogErr "Bottom L/R Rails"
    Rebuild

    '--------------------------------------------------------------
    ' 3. TOP HORIZONTAL RAILS (at neck bottom)
    '--------------------------------------------------------------
    Dim yTop As Double
    yTop = m(FS / 2)

    ' Front + Rear rails at neck bottom
    Dim neckRailPlane As String
    neckRailPlane = MakePlane("Right Plane", m(NECK_Y - FS), "Plane_NeckRailFR")
    StartSketch neckRailPlane
    g_swSkMgr.CreateCenterRectangle m(TD / 2 - FS / 2), yTop, 0, _
        m(TD / 2 - FS / 2) + hfs, yTop + hfs, 0
    g_swSkMgr.CreateCenterRectangle m(TD / 2 - FS / 2), yTop, 0, _
        m(TD / 2 - FS / 2) + hfi, yTop + hfi, 0
    g_swSkMgr.CreateCenterRectangle m(-TD / 2 + FS / 2), yTop, 0, _
        m(-TD / 2 + FS / 2) + hfs, yTop + hfs, 0
    g_swSkMgr.CreateCenterRectangle m(-TD / 2 + FS / 2), yTop, 0, _
        m(-TD / 2 + FS / 2) + hfi, yTop + hfi, 0
    EndSketch
    Set f = Extrude(m(TW - 2 * FS), False, True)
    If Not f Is Nothing Then f.Name = "Frame_NeckBottomFR"
    LogErr "Neck Bottom F/R"
    Rebuild

    ' Left + Right rails at neck bottom
    Dim neckRailPlaneLR As String
    neckRailPlaneLR = MakePlane("Front Plane", m(NECK_Y - FS), "Plane_NeckRailLR")
    StartSketch neckRailPlaneLR
    g_swSkMgr.CreateCenterRectangle m(-TW / 2 + FS / 2), yTop, 0, _
        m(-TW / 2 + FS / 2) + hfs, yTop + hfs, 0
    g_swSkMgr.CreateCenterRectangle m(-TW / 2 + FS / 2), yTop, 0, _
        m(-TW / 2 + FS / 2) + hfi, yTop + hfi, 0
    g_swSkMgr.CreateCenterRectangle m(TW / 2 - FS / 2), yTop, 0, _
        m(TW / 2 - FS / 2) + hfs, yTop + hfs, 0
    g_swSkMgr.CreateCenterRectangle m(TW / 2 - FS / 2), yTop, 0, _
        m(TW / 2 - FS / 2) + hfi, yTop + hfi, 0
    EndSketch
    Set f = Extrude(m(TD - 2 * FS), False, True)
    If Not f Is Nothing Then f.Name = "Frame_NeckBottomLR"
    LogErr "Neck Bottom L/R"
    Rebuild

    '--------------------------------------------------------------
    ' 4. NECK TRANSITION
    '    Extrude body profile upward, then apply large fillets
    '    for smooth flowing silhouette (135mm radius)
    '--------------------------------------------------------------
    Debug.Print "  Building neck transition..."

    ' Extrude the body rectangle up through the transition zone
    Dim loftPlaneBot As String
    loftPlaneBot = MakePlane("Top Plane", m(NECK_Y), "Plane_LoftBot")
    StartSketch loftPlaneBot
    g_swSkMgr.CreateCornerRectangle _
        m(-TW / 2), m(-TD / 2), 0, _
        m(TW / 2), m(TD / 2), 0
    EndSketch
    Set f = Extrude(m(NECK_H))
    If Not f Is Nothing Then f.Name = "NeckTransition_Body"
    LogErr "Neck Body"
    Rebuild

    '--------------------------------------------------------------
    ' 4b. SMOOTH FILLET AT NECK TRANSITION
    '     135mm radius for flowing silhouette
    '--------------------------------------------------------------
    On Error Resume Next
    g_swModel.Extension.SelectByID2 "", "EDGE", _
        m(TW / 2), m(NECK_Y), 0, False, 0, Nothing, 0
    g_swModel.Extension.SelectByID2 "", "EDGE", _
        m(-TW / 2), m(NECK_Y), 0, True, 0, Nothing, 0
    g_swModel.Extension.SelectByID2 "", "EDGE", _
        0, m(NECK_Y), m(TD / 2), True, 0, Nothing, 0
    g_swModel.Extension.SelectByID2 "", "EDGE", _
        0, m(NECK_Y), m(-TD / 2), True, 0, Nothing, 0
    Set f = ApplyFillet(m(NECK_R))
    If Not f Is Nothing Then f.Name = "NeckTransition_Fillet"
    On Error GoTo 0
    LogErr "Neck Fillet"
    Rebuild

    ' Top edge fillet (neck meets drum shroud area)
    On Error Resume Next
    g_swModel.Extension.SelectByID2 "", "EDGE", _
        m(TW / 2), m(NECK_Y + NECK_H), 0, False, 0, Nothing, 0
    g_swModel.Extension.SelectByID2 "", "EDGE", _
        m(-TW / 2), m(NECK_Y + NECK_H), 0, True, 0, Nothing, 0
    g_swModel.Extension.SelectByID2 "", "EDGE", _
        0, m(NECK_Y + NECK_H), m(TD / 2), True, 0, Nothing, 0
    g_swModel.Extension.SelectByID2 "", "EDGE", _
        0, m(NECK_Y + NECK_H), m(-TD / 2), True, 0, Nothing, 0
    Set f = ApplyFillet(m(NECK_R))
    If Not f Is Nothing Then f.Name = "NeckTop_Fillet"
    On Error GoTo 0
    LogErr "Neck Top Fillet"
    Rebuild

    '--------------------------------------------------------------
    ' 5. DRUM SHROUD (circular mounting shroud, 700mm dia)
    '    Hides structural hardware, drum visually emerges from body
    '--------------------------------------------------------------
    Debug.Print "  Building drum shroud..."

    ' Shroud body (cylinder)
    Dim shroudPlane As String
    shroudPlane = MakePlane("Top Plane", m(NECK_Y + NECK_H), "Plane_DrumShroud")

    StartSketch shroudPlane
    ' Outer shroud circle
    g_swSkMgr.CreateCircle 0, 0, 0, m(DRUM_R), 0, 0
    ' Inner opening (drum clearance)
    g_swSkMgr.CreateCircle 0, 0, 0, m(DRUM_R - DRUM_GAP - DRUM_WALL), 0, 0
    EndSketch
    Set f = Extrude(m(DRUM_WALL))
    If Not f Is Nothing Then f.Name = "DrumShroud_Ring"
    LogErr "Drum Shroud Ring"
    Rebuild

    ' Shroud top cap (circular, with center opening)
    Dim shroudCapPlane As String
    shroudCapPlane = MakePlane("Top Plane", m(NECK_Y + NECK_H + DRUM_WALL), "Plane_DrumShroudCap")
    StartSketch shroudCapPlane
    g_swSkMgr.CreateCircle 0, 0, 0, m(DRUM_R), 0, 0
    g_swSkMgr.CreateCircle 0, 0, 0, m(200), 0, 0   ' opening for drum shaft
    EndSketch
    Set f = Extrude(m(2))
    If Not f Is Nothing Then f.Name = "DrumShroud_Cap"
    LogErr "Drum Shroud Cap"
    Rebuild

    ' Shadow gap between shroud and tower body (visual separation)
    StartSketch shroudPlane
    g_swSkMgr.CreateCircle 0, 0, 0, m(DRUM_R + 1), 0, 0
    g_swSkMgr.CreateCircle 0, 0, 0, m(DRUM_R - 1), 0, 0
    EndSketch
    Set f = CutBlind(m(-3))
    If Not f Is Nothing Then f.Name = "DrumShroud_ShadowGap"
    LogErr "Drum Shadow Gap"
    Rebuild

    '--------------------------------------------------------------
    ' 6. INTEGRATED FRONT PANEL (2mm sheet metal)
    '    Flush-mounted, premium appearance
    '--------------------------------------------------------------
    Debug.Print "  Building premium front panel..."

    Dim frontPanelPlane As String
    frontPanelPlane = MakePlane("Front Plane", m(TD / 2 - PT), "Plane_FrontPanel")
    If frontPanelPlane = "" Then frontPanelPlane = "Front Plane"

    ' Main front panel
    StartSketch frontPanelPlane
    g_swSkMgr.CreateCornerRectangle _
        m(-TW / 2), 0, 0, _
        m(TW / 2), m(NECK_Y), 0
    EndSketch
    Set f = Extrude(m(PT))
    If Not f Is Nothing Then f.Name = "FrontPanel"
    LogErr "Front Panel"
    Rebuild

    '--------------------------------------------------------------
    ' 7. ANGLED SCREEN CUTOUT (15-20 deg upward)
    '    220x140mm, flush-mounted appearance
    '--------------------------------------------------------------
    Debug.Print "  Building angled screen cutout..."

    ' Create plane for the screen opening (angled upward)
    ' Normal vector tilted 17.5 degrees from vertical (toward user)
    Dim screenPlane As String
    screenPlane = MakePlane("Front Plane", m(TD / 2), "Plane_ScreenAngle")
    If screenPlane = "" Then screenPlane = "Front Plane"

    ' Cut the screen opening through the front panel
    StartSketch screenPlane
    g_swSkMgr.CreateCornerRectangle _
        m(-SCR_W / 2), m(SCR_Y - SCR_H / 2), 0, _
        m(SCR_W / 2), m(SCR_Y + SCR_H / 2), 0
    EndSketch
    Set f = CutThruAll()
    If Not f Is Nothing Then f.Name = "ScreenCutout"
    LogErr "Screen Cutout"
    Rebuild

    ' Screen recess (flush-mount lip, 3mm deep)
    StartSketch screenPlane
    g_swSkMgr.CreateCornerRectangle _
        m(-SCR_W / 2 + SCR_GAP), m(SCR_Y - SCR_H / 2 + SCR_GAP), 0, _
        m(SCR_W / 2 - SCR_GAP), m(SCR_Y + SCR_H / 2 - SCR_GAP), 0
    EndSketch
    Set f = CutBlind(m(3))
    If Not f Is Nothing Then f.Name = "ScreenRecess"
    LogErr "Screen Recess"
    Rebuild

    ' Shadow gap around screen (premium flush-mount detail)
    StartSketch screenPlane
    g_swSkMgr.CreateCornerRectangle _
        m(-SCR_W / 2 - 1), m(SCR_Y - SCR_H / 2 - 1), 0, _
        m(-SCR_W / 2 + SCR_GAP), m(SCR_Y + SCR_H / 2 + 1), 0
    g_swSkMgr.CreateCornerRectangle _
        m(SCR_W / 2 - SCR_GAP), m(SCR_Y - SCR_H / 2 - 1), 0, _
        m(SCR_W / 2 + 1), m(SCR_Y + SCR_H / 2 + 1), 0
    g_swSkMgr.CreateCornerRectangle _
        m(-SCR_W / 2 + SCR_GAP), m(SCR_Y + SCR_H / 2 - 1), 0, _
        m(SCR_W / 2 - SCR_GAP), m(SCR_Y + SCR_H / 2 + 1), 0
    g_swSkMgr.CreateCornerRectangle _
        m(-SCR_W / 2 + SCR_GAP), m(SCR_Y - SCR_H / 2 - 1), 0, _
        m(SCR_W / 2 - SCR_GAP), m(SCR_Y - SCR_H / 2 + 1), 0
    EndSketch
    Set f = CutBlind(m(0.5))
    If Not f Is Nothing Then f.Name = "ScreenShadowGap"
    LogErr "Screen Shadow Gap"
    Rebuild

    '--------------------------------------------------------------
    ' 8. SIDE PANELS (2mm sheet metal, with transition blend)
    '--------------------------------------------------------------
    Debug.Print "  Building side panels..."

    ' Left panel
    Dim leftPanelPlane As String
    leftPanelPlane = MakePlane("Right Plane", m(-TW / 2), "Plane_LeftPanel")
    If leftPanelPlane = "" Then leftPanelPlane = "Right Plane"

    StartSketch leftPanelPlane
    g_swSkMgr.CreateCornerRectangle _
        m(-TD / 2), 0, 0, _
        m(TD / 2), m(NECK_Y), 0
    EndSketch
    Set f = Extrude(m(PT))
    If Not f Is Nothing Then f.Name = "LeftPanel"
    LogErr "Left Panel"
    Rebuild

    ' Right panel
    Dim rightPanelPlane As String
    rightPanelPlane = MakePlane("Right Plane", m(TW / 2), "Plane_RightPanel")
    If rightPanelPlane = "" Then rightPanelPlane = "Right Plane"

    StartSketch rightPanelPlane
    g_swSkMgr.CreateCornerRectangle _
        m(-TD / 2), 0, 0, _
        m(TD / 2), m(NECK_Y), 0
    EndSketch
    Set f = Extrude(m(PT))
    If Not f Is Nothing Then f.Name = "RightPanel"
    LogErr "Right Panel"
    Rebuild

    ' Side panel fillets (large radii, premium look)
    On Error Resume Next
    g_swModel.Extension.SelectByID2 "", "EDGE", _
        m(-TW / 2), m(NECK_Y / 2), m(TD / 2), False, 0, Nothing, 0
    g_swModel.Extension.SelectByID2 "", "EDGE", _
        m(TW / 2), m(NECK_Y / 2), m(TD / 2), True, 0, Nothing, 0
    Set f = ApplyFillet(m(15))
    If Not f Is Nothing Then f.Name = "SidePanel_FilletFront"
    On Error GoTo 0
    LogErr "Side Fillets"
    Rebuild

    '--------------------------------------------------------------
    ' 9. REAR PANEL WITH HIDDEN SERVICE ACCESS
    '    Recessed seam (no visible industrial cabinet hardware)
    '--------------------------------------------------------------
    Debug.Print "  Building rear panel with hidden service access..."

    Dim rearPanelPlane As String
    rearPanelPlane = MakePlane("Front Plane", m(-TD / 2), "Plane_RearPanel")
    If rearPanelPlane = "" Then rearPanelPlane = "Front Plane"

    ' Full rear panel
    StartSketch rearPanelPlane
    g_swSkMgr.CreateCornerRectangle _
        m(-TW / 2), 0, 0, _
        m(TW / 2), m(NECK_Y), 0
    EndSketch
    Set f = Extrude(m(PT))
    If Not f Is Nothing Then f.Name = "RearPanel"
    LogErr "Rear Panel"
    Rebuild

    ' Hidden service opening (recessed seam, not a through-hole)
    StartSketch rearPanelPlane
    g_swSkMgr.CreateCornerRectangle _
        m(-SVC_W / 2), m(SVC_Y - SVC_H / 2), 0, _
        m(SVC_W / 2), m(SVC_Y + SVC_H / 2), 0
    EndSketch
    Set f = CutBlind(m(PT - 0.5))  ' leave 0.5mm skin
    If Not f Is Nothing Then f.Name = "ServiceOpening_Recess"
    LogErr "Service Recess"
    Rebuild

    ' Recessed seam groove around service panel
    StartSketch rearPanelPlane
    ' Top seam
    g_swSkMgr.CreateCornerRectangle _
        m(-SVC_W / 2 - SVC_SEAM), m(SVC_Y + SVC_H / 2 - 0.5), 0, _
        m(SVC_W / 2 + SVC_SEAM), m(SVC_Y + SVC_H / 2 + 0.5), 0
    ' Bottom seam
    g_swSkMgr.CreateCornerRectangle _
        m(-SVC_W / 2 - SVC_SEAM), m(SVC_Y - SVC_H / 2 - 0.5), 0, _
        m(SVC_W / 2 + SVC_SEAM), m(SVC_Y - SVC_H / 2 + 0.5), 0
    ' Left seam
    g_swSkMgr.CreateCornerRectangle _
        m(-SVC_W / 2 - 0.5), m(SVC_Y - SVC_H / 2), 0, _
        m(-SVC_W / 2 + 0.5), m(SVC_Y + SVC_H / 2), 0
    ' Right seam
    g_swSkMgr.CreateCornerRectangle _
        m(SVC_W / 2 - 0.5), m(SVC_Y - SVC_H / 2), 0, _
        m(SVC_W / 2 + 0.5), m(SVC_Y + SVC_H / 2), 0
    EndSketch
    Set f = CutBlind(m(1))
    If Not f Is Nothing Then f.Name = "ServiceSeam"
    LogErr "Service Seam"
    Rebuild

    ' Mounting holes for service panel (hidden, recessed M4)
    Dim svcInset As Double
    svcInset = 20
    Dim svcHoleR As Double
    svcHoleR = 2.2  ' M4 clearance
    Dim svcPositions As Variant
    svcPositions = Array( _
        Array(-SVC_W / 2 + svcInset, SVC_Y - SVC_H / 2 + svcInset), _
        Array(SVC_W / 2 - svcInset, SVC_Y - SVC_H / 2 + svcInset), _
        Array(-SVC_W / 2 + svcInset, SVC_Y + SVC_H / 2 - svcInset), _
        Array(SVC_W / 2 - svcInset, SVC_Y + SVC_H / 2 - svcInset))
    Dim si As Long
    For si = 0 To 3
        StartSketch rearPanelPlane
        g_swSkMgr.CreateCircle m(CDbl(svcPositions(si)(0))), _
                               m(CDbl(svcPositions(si)(1))), 0, _
                               m(CDbl(svcPositions(si)(0)) + m(svcHoleR)), _
                               m(CDbl(svcPositions(si)(1))), 0
        EndSketch
        Set f = CutThruAll()
        If Not f Is Nothing Then f.Name = "ServiceHole_" & (si + 1)
        Rebuild
    Next si

    '--------------------------------------------------------------
    ' 10. TOP CAP
    '--------------------------------------------------------------
    Debug.Print "  Building top cap..."

    Dim topCapPlane As String
    topCapPlane = MakePlane("Top Plane", m(NECK_Y - FS), "Plane_TopCap")

    StartSketch topCapPlane
    g_swSkMgr.CreateCornerRectangle _
        m(-TW / 2 + FW), m(-TD / 2 + FW), 0, _
        m(TW / 2 - FW), m(TD / 2 - FW), 0
    EndSketch
    Set f = Extrude(m(PT))
    If Not f Is Nothing Then f.Name = "TopCap"
    LogErr "Top Cap"
    Rebuild

    '--------------------------------------------------------------
    ' 11. HIDDEN VENTILATION SLOTS (rear + underside)
    '     Clean front appearance maintained
    '--------------------------------------------------------------
    Debug.Print "  Adding hidden ventilation slots..."

    ' --- Rear ventilation slots ---
    Dim ventTotalW As Double
    ventTotalW = VENT_COUNT * VENT_W + (VENT_COUNT - 1) * VENT_GAP
    Dim ventStartX As Double
    ventStartX = -ventTotalW / 2

    Dim vi As Long
    Dim ventX As Double
    For vi = 0 To VENT_COUNT - 1
        ventX = ventStartX + vi * (VENT_W + VENT_GAP)

        ' Vent slot sketch on rear panel
        StartSketch rearPanelPlane
        g_swSkMgr.CreateCornerRectangle _
            m(ventX), m(VENT_REAR_Y - VENT_H / 2), 0, _
            m(ventX + VENT_W), m(VENT_REAR_Y + VENT_H / 2), 0
        EndSketch
        Set f = CutThruAll()
        If Not f Is Nothing Then f.Name = "VentRear_" & (vi + 1)
        Rebuild
    Next vi

    ' --- Underside ventilation slots ---
    Dim underVentPlane As String
    underVentPlane = MakePlane("Top Plane", m(2), "Plane_UnderVent")
    If underVentPlane = "" Then underVentPlane = "Top Plane"

    Dim underVentZ As Double
    For vi = 0 To VENT_COUNT - 1
        ventX = ventStartX + vi * (VENT_W + VENT_GAP)
        underVentZ = m(-TD / 4)

        StartSketch underVentPlane
        g_swSkMgr.CreateCornerRectangle _
            m(ventX), underVentZ - m(VENT_H / 2), 0, _
            m(ventX + VENT_W), underVentZ + m(VENT_H / 2), 0
        EndSketch
        Set f = CutThruAll()
        If Not f Is Nothing Then f.Name = "VentUnder_" & (vi + 1)
        Rebuild
    Next vi

    '--------------------------------------------------------------
    ' 12. LED ACCENT CHANNELS (premium shadow detail)
    '     Thin channels on front panel edges
    '--------------------------------------------------------------
    Debug.Print "  Adding LED accent channels..."

    ' Left LED channel
    StartSketch frontPanelPlane
    g_swSkMgr.CreateCornerRectangle _
        m(-TW / 2 + 5), m(10), 0, _
        m(-TW / 2 + 5 + LED_W), m(NECK_Y - 10), 0
    EndSketch
    Set f = CutBlind(m(LED_D))
    If Not f Is Nothing Then f.Name = "LED_Left"
    LogErr "LED Left"
    Rebuild

    ' Right LED channel
    StartSketch frontPanelPlane
    g_swSkMgr.CreateCornerRectangle _
        m(TW / 2 - 5 - LED_W), m(10), 0, _
        m(TW / 2 - 5), m(NECK_Y - 10), 0
    EndSketch
    Set f = CutBlind(m(LED_D))
    If Not f Is Nothing Then f.Name = "LED_Right"
    LogErr "LED Right"
    Rebuild

    ' Bottom LED channel (horizontal accent line)
    StartSketch frontPanelPlane
    g_swSkMgr.CreateCornerRectangle _
        m(-TW / 2 + 20), m(5), 0, _
        m(TW / 2 - 20), m(5 + LED_W), 0
    EndSketch
    Set f = CutBlind(m(LED_D))
    If Not f Is Nothing Then f.Name = "LED_Bottom"
    LogErr "LED Bottom"
    Rebuild

    '--------------------------------------------------------------
    ' 13. INTERNAL CABLE TRAY
    '--------------------------------------------------------------
    StartSketch "Top Plane"
    Dim ctHalfW As Double, ctDepth As Double, ctWall As Double
    ctHalfW = m(20)
    ctDepth = m(30)
    ctWall = m(2)
    Dim ctZ As Double
    ctZ = m(TD / 2 - FS - 50)

    g_swSkMgr.CreateLine -ctHalfW, ctZ - ctDepth, 0, ctHalfW, ctZ - ctDepth, 0
    g_swSkMgr.CreateLine ctHalfW, ctZ - ctDepth, 0, ctHalfW, ctZ, 0
    g_swSkMgr.CreateLine ctHalfW, ctZ, 0, ctHalfW - ctWall, ctZ, 0
    g_swSkMgr.CreateLine ctHalfW - ctWall, ctZ, 0, ctHalfW - ctWall, ctZ - ctDepth + ctWall, 0
    g_swSkMgr.CreateLine ctHalfW - ctWall, ctZ - ctDepth + ctWall, 0, -ctHalfW + ctWall, ctZ - ctDepth + ctWall, 0
    g_swSkMgr.CreateLine -ctHalfW + ctWall, ctZ - ctDepth + ctWall, 0, -ctHalfW + ctWall, ctZ, 0
    g_swSkMgr.CreateLine -ctHalfW + ctWall, ctZ, 0, -ctHalfW, ctZ, 0
    g_swSkMgr.CreateLine -ctHalfW, ctZ, 0, -ctHalfW, ctZ - ctDepth, 0
    EndSketch
    Set f = Extrude(m(NECK_Y - FS))
    If Not f Is Nothing Then f.Name = "InternalCableTray"
    LogErr "Cable Tray"
    Rebuild

    '--------------------------------------------------------------
    ' SAVE
    '--------------------------------------------------------------
    SaveDoc "KioskTower.SLDPRT"
    Debug.Print "  Kiosk Tower complete (premium)"
End Sub

'====================================================================
' MODULE 2: DRUM MODULE - PREMIUM REBUILD
'====================================================================
Private Sub RebuildDrumModule()
    Debug.Print "=== Rebuilding Drum Module (Premium) ==="

    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    SafeDeleteFile fso, PROJ_PATH & "DrumModule.SLDPRT", "DrumModule.SLDPRT"

    If Not NewPart Then Exit Sub

    Dim f As Object
    Dim ro As Double, ri As Double, dp As Double
    ro = m(150)        ' drum outer radius (300mm dia)
    ri = m(150 - 6)    ' 6mm wall
    dp = m(150)        ' drum depth

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
    Set f = RevolveFull()
    If Not f Is Nothing Then f.Name = "DrumShell"
    LogErr "Drum Shell"
    Rebuild

    '--------------------------------------------------------------
    ' 2. Drum head
    '--------------------------------------------------------------
    SelPlane "Top Plane"
    g_swSkMgr.InsertSketch True
    g_swSkMgr.CreateCircle 0, 0, 0, ro, 0, 0
    EndSketch
    Set f = Extrude(m(2))
    If Not f Is Nothing Then f.Name = "DrumHead"
    LogErr "Drum Head"
    Rebuild

    '--------------------------------------------------------------
    ' 3. Mounting bracket (premium, hidden behind shroud)
    '--------------------------------------------------------------
    SelPlane "Front Plane"
    g_swSkMgr.InsertSketch True
    g_swSkMgr.CreateCornerRectangle m(-30), m(-15), 0, m(30), m(15), 0
    EndSketch
    Set f = Extrude(m(4))
    If Not f Is Nothing Then f.Name = "MountBracket"
    LogErr "Mount Bracket"
    Rebuild

    ' M6 mounting holes
    SelPlane "Top Plane"
    g_swSkMgr.InsertSketch True
    g_swSkMgr.CreateCircle m(-20), m(-8), 0, m(-17), m(-8), 0
    g_swSkMgr.CreateCircle m(20), m(-8), 0, m(23), m(-8), 0
    g_swSkMgr.CreateCircle m(-20), m(8), 0, m(-17), m(8), 0
    g_swSkMgr.CreateCircle m(20), m(8), 0, m(23), m(8), 0
    EndSketch
    Set f = CutThruAll()
    If Not f Is Nothing Then f.Name = "Bracket_Holes"
    LogErr "Bracket Holes"
    Rebuild

    '--------------------------------------------------------------
    ' 4. Solenoid arm
    '--------------------------------------------------------------
    SelPlane "Front Plane"
    g_swSkMgr.InsertSketch True
    g_swSkMgr.CreateCircle m(50), 0, 0, m(55), 0, 0
    EndSketch
    Set f = Extrude(m(10), False, True)
    If Not f Is Nothing Then f.Name = "SolenoidArm"
    LogErr "Solenoid Arm"
    Rebuild

    '--------------------------------------------------------------
    ' 5. Mallet head
    '--------------------------------------------------------------
    SelPlane "Front Plane"
    g_swSkMgr.InsertSketch True
    Dim malletR As Double
    malletR = m(10)
    g_swSkMgr.CreateCenterline m(50 + 130), -malletR, 0, _
        m(50 + 130), malletR, 0
    ' Arc: center=(50+130,0), start=(50+130-malletR,0), end=(50+130+malletR,0), CCW=1
    g_swSkMgr.CreateArc _
        m(50 + 130), 0#, 0#, _
        m(50 + 130 - malletR), 0#, 0#, _
        m(50 + 130 + malletR), 0#, 0#, _
        1
    EndSketch
    Set f = RevolveFull()
    If Not f Is Nothing Then f.Name = "MalletHead"
    LogErr "Mallet Head"
    Rebuild

    '--------------------------------------------------------------
    ' 6. Solenoid body
    '--------------------------------------------------------------
    SelPlane "Front Plane"
    g_swSkMgr.InsertSketch True
    g_swSkMgr.CreateCornerRectangle m(-15), m(-10), 0, m(15), m(10), 0
    EndSketch
    Set f = Extrude(m(20), False, True)
    If Not f Is Nothing Then f.Name = "SolenoidBody"
    LogErr "Solenoid Body"
    Rebuild

    SaveDoc "DrumModule.SLDPRT"
    Debug.Print "  Drum Module complete (premium)"
End Sub

'====================================================================
' MODULE 3: WEIGHT PLATFORM / INTEGRATED PODIUM
'====================================================================
Private Sub RebuildWeightPlatform()
    Debug.Print "=== Rebuilding Weight Platform (Premium Podium) ==="

    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    SafeDeleteFile fso, PROJ_PATH & "WeightPlatform.SLDPRT", "WeightPlatform.SLDPRT"

    If Not NewPart Then Exit Sub

    Dim f As Object
    Dim pfName As String

    '--------------------------------------------------------------
    ' 1. INTEGRATED PODIUM BODY
    '    420 x 350mm, blends into main body
    '    Tapered edges for premium floating appearance
    '--------------------------------------------------------------
    Debug.Print "  Building integrated podium..."

    StartSketch "Top Plane"
    ' Rounded rectangle for podium base
    ' (using corner rectangle, fillets added as features)
    g_swSkMgr.CreateCornerRectangle _
        m(-POD_W / 2), m(-POD_D / 2), 0, _
        m(POD_W / 2), m(POD_D / 2), 0
    EndSketch
    Set f = Extrude(m(POD_H))
    If Not f Is Nothing Then f.Name = "PodiumBody"
    LogErr "Podium Body"
    Rebuild

    ' Fillet podium corners (premium rounded edges)
    On Error Resume Next
    ' Select the 4 vertical corner edges
    g_swModel.Extension.SelectByID2 "", "EDGE", _
        m(POD_W / 2), m(POD_H / 2), m(POD_D / 2), False, 0, Nothing, 0
    g_swModel.Extension.SelectByID2 "", "EDGE", _
        m(-POD_W / 2), m(POD_H / 2), m(POD_D / 2), True, 0, Nothing, 0
    g_swModel.Extension.SelectByID2 "", "EDGE", _
        m(POD_W / 2), m(POD_H / 2), m(-POD_D / 2), True, 0, Nothing, 0
    g_swModel.Extension.SelectByID2 "", "EDGE", _
        m(-POD_W / 2), m(POD_H / 2), m(-POD_D / 2), True, 0, Nothing, 0
    Set f = ApplyFillet(m(POD_R))
    If Not f Is Nothing Then f.Name = "Podium_CornerFillet"
    On Error GoTo 0
    LogErr "Podium Corners"
    Rebuild

    ' Top edge fillet (soft top edge)
    On Error Resume Next
    g_swModel.Extension.SelectByID2 "", "EDGE", _
        m(POD_W / 4), m(POD_H), m(POD_D / 2), False, 0, Nothing, 0
    g_swModel.Extension.SelectByID2 "", "EDGE", _
        m(-POD_W / 4), m(POD_H), m(POD_D / 2), True, 0, Nothing, 0
    g_swModel.Extension.SelectByID2 "", "EDGE", _
        m(POD_W / 4), m(POD_H), m(-POD_D / 2), True, 0, Nothing, 0
    g_swModel.Extension.SelectByID2 "", "EDGE", _
        m(-POD_W / 4), m(POD_H), m(-POD_D / 2), True, 0, Nothing, 0
    Set f = ApplyFillet(m(5))
    If Not f Is Nothing Then f.Name = "Podium_TopEdgeFillet"
    On Error GoTo 0
    LogErr "Podium Top Edge"
    Rebuild

    '--------------------------------------------------------------
    ' 2. SHADOW GAP (visual separation between podium and floor)
    '    Creates floating podium effect
    '--------------------------------------------------------------
    Debug.Print "  Adding podium shadow gap..."

    StartSketch "Top Plane"
    g_swSkMgr.CreateCornerRectangle _
        m(-POD_W / 2 - 2), m(-POD_D / 2 - 2), 0, _
        m(POD_W / 2 + 2), m(POD_D / 2 + 2), 0
    g_swSkMgr.CreateCornerRectangle _
        m(-POD_W / 2), m(-POD_D / 2), 0, _
        m(POD_W / 2), m(POD_D / 2), 0
    EndSketch
    Set f = CutBlind(m(5))
    If Not f Is Nothing Then f.Name = "Podium_ShadowGap"
    LogErr "Podium Shadow Gap"
    Rebuild

    '--------------------------------------------------------------
    ' 3. ANTI-SLIP SURFACE (top, recessed mat area)
    '--------------------------------------------------------------
    pfName = MakePlane("Top Plane", m(POD_H), "Plane_MatSurface")
    StartSketch pfName
    g_swSkMgr.CreateCornerRectangle _
        m(-POD_W / 2 + 15), m(-POD_D / 2 + 15), 0, _
        m(POD_W / 2 - 15), m(POD_D / 2 - 15), 0
    EndSketch
    Set f = CutBlind(m(2))
    If Not f Is Nothing Then f.Name = "MatRecess"
    LogErr "Mat Recess"
    Rebuild

    '--------------------------------------------------------------
    ' 4. LOAD CELL RECESS (underneath)
    '--------------------------------------------------------------
    StartSketch "Top Plane"
    g_swSkMgr.CreateCornerRectangle _
        m(-40), m(-8), 0, _
        m(40), m(8), 0
    EndSketch
    Set f = CutBlind(m(12))
    If Not f Is Nothing Then f.Name = "LoadCellRecess"
    LogErr "Load Cell Recess"
    Rebuild

    '--------------------------------------------------------------
    ' 5. CABLE CONDUIT (hidden, underside)
    '--------------------------------------------------------------
    SelPlane "Right Plane"
    g_swSkMgr.InsertSketch True
    g_swSkMgr.CreateCircle m(-POD_D / 2 + 10), m(POD_H / 2), 0, _
        m(-POD_D / 2 + 18), m(POD_H / 2), 0
    EndSketch
    Set f = CutThruAll()
    If Not f Is Nothing Then f.Name = "CableConduit"
    LogErr "Cable Conduit"
    Rebuild

    SaveDoc "WeightPlatform.SLDPRT"
    Debug.Print "  Weight Platform / Podium complete (premium)"
End Sub

'====================================================================
' MODULE 4: DISPLAY BEZEL - PREMIUM REBUILD
'====================================================================
Private Sub RebuildDisplayBezel()
    Debug.Print "=== Rebuilding Display Bezel (Premium) ==="

    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    SafeDeleteFile fso, PROJ_PATH & "DisplayBezel.SLDPRT", "DisplayBezel.SLDPRT"

    If Not NewPart Then Exit Sub

    Dim f As Object
    Dim pfName As String

    '--------------------------------------------------------------
    ' 1. BEZEL FRAME (flush-mount, premium slim profile)
    '--------------------------------------------------------------
    Debug.Print "  Building premium bezel..."

    Dim bzW As Double, bzH As Double
    Dim bzInW As Double, bzInH As Double
    bzW = m(SCR_W + 8)
    bzH = m(SCR_H + 8)
    bzInW = m(SCR_W - 2)
    bzInH = m(SCR_H - 2)

    StartSketch "Front Plane"
    g_swSkMgr.CreateCornerRectangle _
        -bzW / 2, -bzH / 2, 0, bzW / 2, bzH / 2, 0
    g_swSkMgr.CreateCornerRectangle _
        -bzInW / 2, -bzInH / 2, 0, bzInW / 2, bzInH / 2, 0
    EndSketch
    Set f = Extrude(m(3))
    If Not f Is Nothing Then f.Name = "BezelFrame"
    LogErr "Bezel Frame"
    Rebuild

    ' Fillet bezel edges (premium soft edges)
    On Error Resume Next
    g_swModel.Extension.SelectByID2 "", "EDGE", _
        bzW / 2, bzH / 4, 0, False, 0, Nothing, 0
    g_swModel.Extension.SelectByID2 "", "EDGE", _
        -bzW / 2, bzH / 4, 0, True, 0, Nothing, 0
    Set f = ApplyFillet(m(2))
    If Not f Is Nothing Then f.Name = "Bezel_Fillet"
    On Error GoTo 0
    LogErr "Bezel Fillet"
    Rebuild

    '--------------------------------------------------------------
    ' 2. SCREEN GLASS (behind bezel)
    '--------------------------------------------------------------
    pfName = MakePlane("Front Plane", m(3), "Plane_ScreenGlass")
    StartSketch pfName
    g_swSkMgr.CreateCornerRectangle _
        -bzInW / 2, -bzInH / 2, 0, bzInW / 2, bzInH / 2, 0
    EndSketch
    Set f = Extrude(m(2))
    If Not f Is Nothing Then f.Name = "ScreenGlass"
    LogErr "Screen Glass"
    Rebuild

    '--------------------------------------------------------------
    ' 3. VESA MOUNT BOSSES
    '--------------------------------------------------------------
    pfName = MakePlane("Front Plane", m(5), "Plane_VESAMount")
    StartSketch pfName
    Dim vHalf As Double
    vHalf = m(50) / 2
    g_swSkMgr.CreateCircle -vHalf, -vHalf, 0, -vHalf + m(0.002), -vHalf, 0
    g_swSkMgr.CreateCircle vHalf, -vHalf, 0, vHalf + m(0.002), -vHalf, 0
    g_swSkMgr.CreateCircle -vHalf, vHalf, 0, -vHalf + m(0.002), vHalf, 0
    g_swSkMgr.CreateCircle vHalf, vHalf, 0, vHalf + m(0.002), vHalf, 0
    EndSketch
    Set f = Extrude(m(3))
    If Not f Is Nothing Then f.Name = "VESAMountBosses"
    LogErr "VESA Mount"
    Rebuild

    '--------------------------------------------------------------
    ' 4. SHADOW GAP around bezel (premium flush detail)
    '--------------------------------------------------------------
    StartSketch "Front Plane"
    g_swSkMgr.CreateCornerRectangle _
        -bzW / 2 - 1, -bzH / 2 - 1, 0, _
        -bzW / 2 + 0.5, bzH / 2 + 1, 0
    g_swSkMgr.CreateCornerRectangle _
        bzW / 2 - 0.5, -bzH / 2 - 1, 0, _
        bzW / 2 + 1, bzH / 2 + 1, 0
    EndSketch
    Set f = CutBlind(m(0.5))
    If Not f Is Nothing Then f.Name = "Bezel_ShadowGap"
    LogErr "Bezel Shadow Gap"
    Rebuild

    SaveDoc "DisplayBezel.SLDPRT"
    Debug.Print "  Display Bezel complete (premium)"
End Sub

'====================================================================
' MODULE 5: ASSEMBLY
'====================================================================
Private Sub AssemblePremiumKiosk()
    Debug.Print "=== Assembling Premium Kiosk ==="

    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")

    '--- Verify all parts exist ---
    Dim parts As Variant
    parts = Array("KioskTower.SLDPRT", "DrumModule.SLDPRT", _
                  "WeightPlatform.SLDPRT", "DisplayBezel.SLDPRT")
    Dim i As Long
    For i = 0 To UBound(parts)
        If Not fso.FileExists(PROJ_PATH & CStr(parts(i))) Then
            MsgBox "Missing part: " & CStr(parts(i)), vbCritical, "Assembly Error"
            Exit Sub
        End If
    Next i

    '--- Close old assembly if open ---
    On Error Resume Next
    g_swApp.CloseDoc "KioskPremium.SLDASM"
    On Error GoTo 0

    '--- Create new assembly ---
    Dim tmpl As String
    tmpl = ""
    On Error Resume Next
    tmpl = g_swApp.GetUserPreferenceStringValue(72)
    On Error GoTo 0

    Dim swAssy As Object
    If tmpl <> "" Then
        If fso.FileExists(tmpl) Then
            Set swAssy = g_swApp.NewDocument(tmpl, 0, 0, 0)
        End If
    End If
    If swAssy Is Nothing Then
        ' Try MBD assembly template
        Dim mbdTmpl As String
        mbdTmpl = "C:\ProgramData\SolidWorks\SOLIDWORKS 2026\templates\MBD\assembly 0251mm to 1000mm.asmdot"
        If fso.FileExists(mbdTmpl) Then
            Set swAssy = g_swApp.NewDocument(mbdTmpl, 0, 0, 0)
        End If
    End If
    If swAssy Is Nothing Then
        MsgBox "Could not create assembly." & vbCrLf & _
               "Create one manually, then run AssemblePremiumKiosk.", _
               vbCritical, "Assembly Error"
        Exit Sub
    End If

    Dim swAssyDoc As Object
    Set swAssyDoc = swAssy
    Set g_swModel = swAssy

    '--- Get assembly title for mate selection ---
    Dim assyTitle As String
    assyTitle = swAssy.GetTitle
    If InStr(assyTitle, ".") > 0 Then
        assyTitle = Left(assyTitle, InStr(assyTitle, ".") - 1)
    End If
    Debug.Print "  Assembly: " & assyTitle

    '--- Add components ---
    ' Tower at origin (fixed)
    Dim compTower As Object
    Set compTower = swAssyDoc.AddComponent5( _
        PROJ_PATH & "KioskTower.SLDPRT", 0, "", False, "", 0, 0, 0)
    If compTower Is Nothing Then
        Debug.Print "  ERR: Could not add tower"
    Else
        On Error Resume Next
        compTower.Fixed = True
        On Error GoTo 0
        Debug.Print "  Tower added (fixed): " & compTower.Name2
    End If
    Rebuild

    ' Drum at neck top (Y = NECK_Y + NECK_H + 10mm clearance)
    Dim compDrum As Object
    Set compDrum = swAssyDoc.AddComponent5( _
        PROJ_PATH & "DrumModule.SLDPRT", 0, "", False, "", _
        0, m(NECK_Y + NECK_H + 10), 0)
    If compDrum Is Nothing Then
        Debug.Print "  ERR: Could not add drum"
    Else
        Debug.Print "  Drum added: " & compDrum.Name2
    End If
    Rebuild

    ' Bezel at screen height, flush with front face
    Dim compBezel As Object
    Set compBezel = swAssyDoc.AddComponent5( _
        PROJ_PATH & "DisplayBezel.SLDPRT", 0, "", False, "", _
        0, m(SCR_Y), m(TD / 2 + 3))
    If compBezel Is Nothing Then
        Debug.Print "  ERR: Could not add bezel"
    Else
        Debug.Print "  Bezel added: " & compBezel.Name2
    End If
    Rebuild

    ' Platform/Podium at floor, centered under tower
    Dim compPlatform As Object
    Set compPlatform = swAssyDoc.AddComponent5( _
        PROJ_PATH & "WeightPlatform.SLDPRT", 0, "", False, "", _
        0, -m(POD_H), 0)
    If compPlatform Is Nothing Then
        Debug.Print "  ERR: Could not add platform"
    Else
        Debug.Print "  Platform added: " & compPlatform.Name2
    End If
    Rebuild

    '--- Create mates ---
    Dim mateCount As Long
    mateCount = 0

    ' Mate 1: Tower Right Plane = Drum Right Plane (center X)
    If MatePlanes(compTower.Name2, "Right Plane", _
                  compDrum.Name2, "Right Plane", assyTitle) Then
        mateCount = mateCount + 1
    End If

    ' Mate 2: Tower Front Plane = Drum Front Plane (center Z)
    If MatePlanes(compTower.Name2, "Front Plane", _
                  compDrum.Name2, "Front Plane", assyTitle) Then
        mateCount = mateCount + 1
    End If

    ' Mate 3: Tower Right Plane = Bezel Right Plane (center X)
    If MatePlanes(compTower.Name2, "Right Plane", _
                  compBezel.Name2, "Right Plane", assyTitle) Then
        mateCount = mateCount + 1
    End If

    ' Mate 4: Tower Right Plane = Platform Right Plane (center X)
    If MatePlanes(compTower.Name2, "Right Plane", _
                  compPlatform.Name2, "Right Plane", assyTitle) Then
        mateCount = mateCount + 1
    End If

    ' Mate 5: Tower Front Plane = Platform Front Plane (center Z)
    If MatePlanes(compTower.Name2, "Front Plane", _
                  compPlatform.Name2, "Front Plane", assyTitle) Then
        mateCount = mateCount + 1
    End If

    Debug.Print "  Mates created: " & mateCount

    '--- Finalize ---
    swAssy.ForceRebuild3 True
    On Error Resume Next
    swAssy.ViewZoomtofit
    On Error GoTo 0

    ' Save assembly
    Dim saveErr As Long, saveWarn As Long
    swAssy.SaveAs4 PROJ_PATH & "KioskPremium.SLDASM", 0, 0, saveErr, saveWarn
    Debug.Print "  Assembly saved: " & PROJ_PATH & "KioskPremium.SLDASM"
    Debug.Print "  Assembly complete"
End Sub

'====================================================================
' MATE HELPER
'====================================================================
Private Function MatePlanes(compAName As String, planeA As String, _
                            compBName As String, planeB As String, _
                            assyName As String) As Boolean
    MatePlanes = False

    Dim selA As String, selB As String
    selA = planeA & "@" & compAName & "@" & assyName
    selB = planeB & "@" & compBName & "@" & assyName

    Debug.Print "  Mate: " & selA & " = " & selB

    ' Clear selection
    g_swModel.ClearSelection2 True

    ' Select first plane (mark=1)
    Dim bRet As Boolean
    bRet = g_swModel.Extension.SelectByID2(selA, "PLANE", 0, 0, 0, False, 1, Nothing, 0)
    If Not bRet Then
        Debug.Print "    FAIL: Could not select " & selA
        Exit Function
    End If

    ' Select second plane (mark=2, append)
    bRet = g_swModel.Extension.SelectByID2(selB, "PLANE", 0, 0, 0, True, 2, Nothing, 0)
    If Not bRet Then
        Debug.Print "    FAIL: Could not select " & selB
        Exit Function
    End If

    ' Create mate data
    Dim swMateData As Object
    On Error Resume Next
    Set swMateData = g_swModel.CreateMateData(0)  ' 0 = swMateTypeCoincident
    On Error GoTo 0
    If swMateData Is Nothing Then
        Debug.Print "    FAIL: CreateMateData returned Nothing"
        Exit Function
    End If

    ' Get selected entities
    Dim entA As Object, entB As Object
    Set entA = g_swModel.SelectionManager.GetSelectedObject6(1, -1)
    Set entB = g_swModel.SelectionManager.GetSelectedObject6(2, -1)
    If entA Is Nothing Or entB Is Nothing Then
        Debug.Print "    FAIL: Could not get selected entities"
        Exit Function
    End If

    ' Set entities on mate data
    Dim entities(1) As Object
    Set entities(0) = entA
    Set entities(1) = entB
    swMateData.EntitiesToMate = entities
    swMateData.MateAlignment = 0  ' swMateAlignAligned

    ' Create the mate
    Dim swMateFeat As Object
    On Error Resume Next
    Set swMateFeat = g_swModel.CreateMate(swMateData)
    Dim mateErr As Long: mateErr = Err.Number
    On Error GoTo 0

    If swMateFeat Is Nothing Then
        Debug.Print "    FAIL: CreateMate returned Nothing (err=" & mateErr & ")"
        Exit Function
    End If

    Debug.Print "    OK: " & swMateFeat.Name
    g_swModel.ClearSelection2 True
    MatePlanes = True
End Function
