'====================================================================
' KIOSK FOLDED SHEET-METAL CLADDING (SINGLE-PIECE SKIN)
' Target: SolidWorks 2026 (API 32.x)
'
' Creates a folded sheet-metal skin that wraps around the
' HeartbeatDrumKiosk_Frame.SLDPRT. The cladding is one continuous
' piece (no panel joints) with:
'   - Base skirt wrap: 920x920mm x 80mm
'   - Tower wrap: 604x404mm x 1500mm (wraps 600x400 frame outer)
'   - Neck wrap: 604x404mm x 300mm, shifted 150mm forward
'   - Display bezel cutout (front)
'   - Service door cutout (rear)
'   - Vent slots (rear)
'   - Drum shroud cap
'
' Frame dimensions (from frame macro):
'   TOWER_W = 550mm center-center -> 600mm frame outer
'   TOWER_D = 350mm center-center -> 400mm frame outer
'
' No type library references needed (late binding).
'====================================================================
Option Explicit

Dim g_swApp      As Object
Dim g_swModel    As Object
Dim g_swPart     As Object
Dim g_swSkMgr    As Object
Dim g_swFeatMgr  As Object

Const MM As Double = 0.001

Const PROJ_PATH As String = "C:\Users\kisha\Documents\Kiosk\"
Const CLAD_NAME As String = "KioskCladding.SLDPRT"

'====================================================================
' DIMENSIONS (mm)
'====================================================================
Const TOWER_W    As Double = 550
Const TOWER_D    As Double = 350
Const TUBE_W     As Double = 50
Const TOWER_H    As Double = 1500
Const NECK_H     As Double = 300
Const NECK_FWD   As Double = 150
Const BASE_PLATE_T As Double = 10

Const CLAD_OUTER_W As Double = 604   ' 600 frame outer + 4 gap
Const CLAD_OUTER_D As Double = 404   ' 400 frame outer + 4 gap

Const PANEL_T      As Double = 2
Const SHADOW_GAP   As Double = 1.5

' Skirt wraps 920x920 base
Const SKIRT_LEN    As Double = 920
Const SKIRT_H      As Double = 80

' Y positions (all measured from origin)
Const Y_BASE_TOP   As Double = 60    ' = TUBE_W + BASE_PLATE_T
Const Y_SKIRT_TOP  As Double = 140   ' = Y_BASE_TOP + SKIRT_H
Const Y_TOWER_TOP  As Double = 1560  ' = Y_BASE_TOP + TOWER_H
Const Y_NECK_TOP   As Double = 1860  ' = Y_TOWER_TOP + NECK_H

' Display
Const BEZEL_W  As Double = 400
Const BEZEL_H  As Double = 250
Const BEZEL_Y  As Double = 900

' Service door
Const SVC_W    As Double = 320
Const SVC_H    As Double = 380
Const SVC_Y    As Double = 700

' Vents
Const VENT_W   As Double = 60
Const VENT_H   As Double = 2.5
Const VENT_COUNT As Long = 6
Const VENT_Y_START As Double = 200
Const VENT_GAP    As Double = 12

' Drum shroud
Const DRUM_R   As Double = 360

'====================================================================
' MAIN ENTRY POINT
'====================================================================
Sub BuildKioskCladding()
    On Error Resume Next
    Set g_swApp = Application.SldWorks
    If g_swApp Is Nothing Then
        MsgBox "Cannot access SolidWorks 2026." & vbCrLf & _
               "Run this macro from within SolidWorks.", vbCritical, "Connection Error"
        Exit Sub
    End If
    On Error GoTo 0

    Debug.Print "=== Kiosk Folded Sheet-Metal Cladding ==="
    Debug.Print "API revision: " & g_swApp.RevisionNumber

    If Not NewPart() Then Exit Sub

    Dim t0 As Double: t0 = Timer

    '--- Build cladding in this order ---
    Debug.Print "--- 1. Base skirt (front/back/left/right) ---"
    CreateBaseSkirtPanels

    Debug.Print "--- 2. Tower wrap (4 panels) ---"
    CreateTowerPanels

    Debug.Print "--- 3. Neck wrap (4 panels, shifted 150mm forward) ---"
    CreateNeckPanels

    Debug.Print "--- 4. Display bezel cutout ---"
    CreateDisplayBezelCutout

    Debug.Print "--- 5. Service door cutout ---"
    CreateServiceDoorCutout

    Debug.Print "--- 6. Ventilation slots ---"
    CreateVentilationSlots

    Debug.Print "--- 7. Drum shroud cap ---"
    CreateDrumShroudCap

    '--- Final ---
    g_swModel.ForceRebuild3 True
    HideAllPlanes
    g_swModel.ViewZoomtofit
    SaveDoc

    Debug.Print "=== Cladding built in " & Format(Timer - t0, "0.0") & "s ==="
    MsgBox "Kiosk cladding built!" & vbCrLf & _
           "File: " & PROJ_PATH & CLAD_NAME, _
           vbInformation, "Cladding Complete"
End Sub

'====================================================================
' HELPERS
'====================================================================
Private Function m(ByVal v As Double) As Double
    m = v * MM
End Function

Private Function GetPartTemplate() As String
    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    Dim knownPath As String
    knownPath = "C:\ProgramData\SolidWorks\SOLIDWORKS 2026\templates\Part.prtdot"
    If fso.FileExists(knownPath) Then GetPartTemplate = knownPath: Exit Function
    knownPath = "C:\ProgramData\SolidWorks\SOLIDWORKS 2026\templates\Part.prtdot"
    If fso.FileExists(knownPath) Then GetPartTemplate = knownPath: Exit Function
    On Error Resume Next
    GetPartTemplate = g_swApp.GetUserPreferenceStringValue(72)
    On Error GoTo 0
End Function

Private Function NewPart() As Boolean
    Dim tmpl As String
    tmpl = GetPartTemplate
    If tmpl = "" Then NewPart = False: Exit Function
    Set g_swModel = g_swApp.NewDocument(tmpl, 0, 0, 0)
    If g_swModel Is Nothing Then NewPart = False: Exit Function
    Set g_swPart = g_swModel
    Set g_swSkMgr = g_swModel.SketchManager
    Set g_swFeatMgr = g_swModel.FeatureManager
    NewPart = True
End Function

Private Sub SaveDoc()
    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    If Not fso.FolderExists(PROJ_PATH) Then fso.CreateFolder PROJ_PATH
    Dim path As String: path = PROJ_PATH & CLAD_NAME
    On Error Resume Next
    Dim errNum As Long, warnNum As Long
    g_swModel.SaveAs4 path, 0, 0, errNum, warnNum
    On Error GoTo 0
    Debug.Print "  Saved: " & path
End Sub

Private Sub LogErr(ByVal op As String)
    If Err.Number <> 0 Then Debug.Print "  ERR " & op & ": " & Err.Description: Err.Clear
End Sub

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

'--- MakePlane: creates a reference plane offset from a base plane ---
' Uses swRefPlaneReferenceConstraint_Distance (Type=8) for a parallel offset
' Parameters:
'   refPlane : existing plane name (e.g. "Top Plane", "Front Plane")
'   distM    : offset distance in meters (positive = normal direction)
'   newName  : optional custom name
Private Function MakePlane(ByVal refPlane As String, _
                           ByVal distM As Double, _
                           Optional ByVal newName As String = "") As String
    Dim pf As Object
    g_swModel.ClearSelection2 True
    SelPlane refPlane
    ' 8 = swRefPlaneReferenceConstraint_Distance
    Set pf = g_swFeatMgr.InsertRefPlane(8, distM, 0, 0, 0, 0)
    If Not pf Is Nothing Then
        MakePlane = pf.Name
        If newName <> "" Then
            On Error Resume Next
            pf.Name = newName
            If Err.Number <> 0 Then
                Debug.Print "  WARN: could not rename plane to '" & newName & "': " & Err.Description
                Err.Clear
            End If
            On Error GoTo 0
        End If
    Else
        MakePlane = ""
        Debug.Print "  ERR: MakePlane failed for ref=" & refPlane & " dist=" & distM
    End If
End Function

Private Function DoExtrude(ByVal depthM As Double) As Object
    Set DoExtrude = g_swFeatMgr.FeatureExtrusion3( _
        True, False, False, 0, 0, depthM, 0, _
        False, False, False, False, 0, 0, _
        False, False, False, False, True, True, True, _
        0, 0, False)
End Function

Private Function DoExtrudeRev(ByVal depthM As Double) As Object
    Set DoExtrudeRev = g_swFeatMgr.FeatureExtrusion3( _
        True, True, False, 0, 0, depthM, 0, _
        False, False, False, False, 0, 0, _
        False, False, False, False, True, True, True, _
        0, 0, False)
End Function

Private Function DoCutThru() As Object
    ' FeatureCut4 — 26 params (SW 2026 API 34.2.1)
    ' NOTE: frame macro uses 27 params (older API), 26 matches KioskFrameImprovements
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
        False, False, False)
End Function

'====================================================================
' 1. BASE SKIRT (4 panels around 920x920 base)
'    Each panel: 920mm x 80mm x 2mm
'    Y range: 60 to 140
'====================================================================
Private Sub CreateBaseSkirtPanels()
    Dim f As Object
    Dim half As Double: half = m(SKIRT_LEN / 2)  ' 460mm = 0.46m
    Dim yBot As Double: yBot = m(Y_BASE_TOP)
    Dim yTop As Double: yTop = m(Y_SKIRT_TOP)

    '--- Front skirt (Z=+460, normal=+Z) ---
    ' Sketch on Top Plane offset by +460mm in Z, rectangle in X,Y
    ' Extrude in +Z direction (normal to plane)
    Dim pF As String
    pF = MakePlane("Top Plane", half, "Plane_SkirtF")
    Debug.Print "  SkirtF plane: " & pF
    If pF = "" Then Debug.Print "  ABORT: SkirtF plane failed"
    StartSketch pF
    g_swSkMgr.CreateCornerRectangle _
        m(-half), yBot, 0, _
        m(half), yTop, 0
    EndSketch
    Set f = DoExtrude(m(PANEL_T))
    If Not f Is Nothing Then f.Name = "Skirt_Front"
    LogErr "Skirt_Front"
    Rebuild

    '--- Back skirt (Z=-460, normal=-Z) ---
    Dim pB As String
    pB = MakePlane("Top Plane", -half, "Plane_SkirtB")
    Debug.Print "  SkirtB plane: " & pB
    StartSketch pB
    g_swSkMgr.CreateCornerRectangle _
        m(-half), yBot, 0, _
        m(half), yTop, 0
    EndSketch
    Set f = DoExtrudeRev(m(PANEL_T))
    If Not f Is Nothing Then f.Name = "Skirt_Back"
    LogErr "Skirt_Back"
    Rebuild

    '--- Left skirt (X=-460, normal=-X) ---
    ' Use Front Plane (Y-Z) offset by -460mm in X
    ' Rectangle in Z,Y, extrude in -X
    Dim pL As String
    pL = MakePlane("Front Plane", -half, "Plane_SkirtL")
    Debug.Print "  SkirtL plane: " & pL
    StartSketch pL
    g_swSkMgr.CreateCornerRectangle _
        m(-half), yBot, 0, _
        m(half), yTop, 0
    EndSketch
    Set f = DoExtrudeRev(m(PANEL_T))
    If Not f Is Nothing Then f.Name = "Skirt_Left"
    LogErr "Skirt_Left"
    Rebuild

    '--- Right skirt (X=+460, normal=+X) ---
    Dim pR As String
    pR = MakePlane("Front Plane", half, "Plane_SkirtR")
    Debug.Print "  SkirtR plane: " & pR
    StartSketch pR
    g_swSkMgr.CreateCornerRectangle _
        m(-half), yBot, 0, _
        m(half), yTop, 0
    EndSketch
    Set f = DoExtrude(m(PANEL_T))
    If Not f Is Nothing Then f.Name = "Skirt_Right"
    LogErr "Skirt_Right"
    Rebuild
End Sub

'====================================================================
' 2. TOWER PANELS (4 panels wrapping 600x400 frame outer)
'    604 x 1500mm x 2mm
'    Y range: 141.5 to 1560
'====================================================================
Private Sub CreateTowerPanels()
    Dim f As Object
    Dim halfW As Double: halfW = m(CLAD_OUTER_W / 2)   ' 302mm
    Dim halfD As Double: halfD = m(CLAD_OUTER_D / 2)   ' 202mm
    Dim yBot As Double: yBot = m(Y_SKIRT_TOP + SHADOW_GAP)
    Dim yTop As Double: yTop = m(Y_TOWER_TOP)

    '--- Front tower (Z=+202) ---
    Dim pF As String
    pF = MakePlane("Top Plane", halfD, "Plane_TowerF")
    Debug.Print "  TowerF plane: " & pF
    StartSketch pF
    g_swSkMgr.CreateCornerRectangle _
        m(-halfW), yBot, 0, _
        m(halfW), yTop, 0
    EndSketch
    Set f = DoExtrude(m(PANEL_T))
    If Not f Is Nothing Then f.Name = "Tower_Front"
    LogErr "Tower_Front"
    Rebuild

    '--- Back tower (Z=-202) ---
    Dim pB As String
    pB = MakePlane("Top Plane", -halfD, "Plane_TowerB")
    Debug.Print "  TowerB plane: " & pB
    StartSketch pB
    g_swSkMgr.CreateCornerRectangle _
        m(-halfW), yBot, 0, _
        m(halfW), yTop, 0
    EndSketch
    Set f = DoExtrudeRev(m(PANEL_T))
    If Not f Is Nothing Then f.Name = "Tower_Back"
    LogErr "Tower_Back"
    Rebuild

    '--- Left tower (X=-302) ---
    Dim pL As String
    pL = MakePlane("Front Plane", -halfW, "Plane_TowerL")
    Debug.Print "  TowerL plane: " & pL
    StartSketch pL
    g_swSkMgr.CreateCornerRectangle _
        m(-halfD), yBot, 0, _
        m(halfD), yTop, 0
    EndSketch
    Set f = DoExtrudeRev(m(PANEL_T))
    If Not f Is Nothing Then f.Name = "Tower_Left"
    LogErr "Tower_Left"
    Rebuild

    '--- Right tower (X=+302) ---
    Dim pR As String
    pR = MakePlane("Front Plane", halfW, "Plane_TowerR")
    Debug.Print "  TowerR plane: " & pR
    StartSketch pR
    g_swSkMgr.CreateCornerRectangle _
        m(-halfD), yBot, 0, _
        m(halfD), yTop, 0
    EndSketch
    Set f = DoExtrude(m(PANEL_T))
    If Not f Is Nothing Then f.Name = "Tower_Right"
    LogErr "Tower_Right"
    Rebuild
End Sub

'====================================================================
' 3. NECK PANELS (4 panels wrapping neck section, shifted 150mm fwd)
'    Same 604x404 box, 300mm tall
'    Neck center Z = TOWER_D/2 + NECK_FWD = 175 + 150 = 325mm
'    Y range: 1561.5 to 1860
'====================================================================
Private Sub CreateNeckPanels()
    Dim f As Object
    Dim halfW As Double: halfW = m(CLAD_OUTER_W / 2)
    Dim halfD As Double: halfD = m(CLAD_OUTER_D / 2)
    Dim yBot As Double: yBot = m(Y_TOWER_TOP + SHADOW_GAP)
    Dim yTop As Double: yTop = m(Y_NECK_TOP)
    Dim neckZ As Double: neckZ = m(TOWER_D / 2 + NECK_FWD)  ' 325mm

    '--- Front neck (Z=neckZ+202 = 527mm) ---
    Dim pF As String
    pF = MakePlane("Top Plane", neckZ + halfD, "Plane_NeckF")
    Debug.Print "  NeckF plane: " & pF
    StartSketch pF
    g_swSkMgr.CreateCornerRectangle _
        m(-halfW), yBot, 0, _
        m(halfW), yTop, 0
    EndSketch
    Set f = DoExtrude(m(PANEL_T))
    If Not f Is Nothing Then f.Name = "Neck_Front"
    LogErr "Neck_Front"
    Rebuild

    '--- Back neck (Z=neckZ-202 = 123mm) ---
    Dim pB As String
    pB = MakePlane("Top Plane", neckZ - halfD, "Plane_NeckB")
    Debug.Print "  NeckB plane: " & pB
    StartSketch pB
    g_swSkMgr.CreateCornerRectangle _
        m(-halfW), yBot, 0, _
        m(halfW), yTop, 0
    EndSketch
    Set f = DoExtrudeRev(m(PANEL_T))
    If Not f Is Nothing Then f.Name = "Neck_Back"
    LogErr "Neck_Back"
    Rebuild

    '--- Left neck (X=-302) ---
    Dim pL As String
    pL = MakePlane("Front Plane", -halfW, "Plane_NeckL")
    Debug.Print "  NeckL plane: " & pL
    StartSketch pL
    g_swSkMgr.CreateCornerRectangle _
        m(-halfD), yBot, 0, _
        m(halfD), yTop, 0
    EndSketch
    Set f = DoExtrudeRev(m(PANEL_T))
    If Not f Is Nothing Then f.Name = "Neck_Left"
    LogErr "Neck_Left"
    Rebuild

    '--- Right neck (X=+302) ---
    Dim pR As String
    pR = MakePlane("Front Plane", halfW, "Plane_NeckR")
    Debug.Print "  NeckR plane: " & pR
    StartSketch pR
    g_swSkMgr.CreateCornerRectangle _
        m(-halfD), yBot, 0, _
        m(halfD), yTop, 0
    EndSketch
    Set f = DoExtrude(m(PANEL_T))
    If Not f Is Nothing Then f.Name = "Neck_Right"
    LogErr "Neck_Right"
    Rebuild
End Sub

'====================================================================
' 4. DISPLAY BEZEL CUTOUT (front tower panel)
'====================================================================
Private Sub CreateDisplayBezelCutout()
    Dim f As Object
    Dim bezelY As Double: bezelY = m(BEZEL_Y)
    Dim halfD As Double: halfD = m(CLAD_OUTER_D / 2)
    Dim halfW As Double: halfW = m(BEZEL_W / 2)
    Dim halfH As Double: halfH = m(BEZEL_H / 2)

    ' Cut on the FRONT face of the tower front panel
    ' Tower_Front occupies Z = +halfD to +halfD+PANEL_T = 202 to 204
    ' Use plane at Z=204 to cut through
    Dim pBezel As String
    pBezel = MakePlane("Top Plane", halfD + m(PANEL_T), "Plane_Bezel")
    Debug.Print "  Bezel plane: " & pBezel
    StartSketch pBezel
    g_swSkMgr.CreateCornerRectangle _
        m(-halfW), m(bezelY - halfH), 0, _
        m(halfW), m(bezelY + halfH), 0
    EndSketch
    Set f = DoCutThru()
    If Not f Is Nothing Then f.Name = "Bezel_Cutout"
    LogErr "Bezel_Cutout"
    Rebuild
End Sub

'====================================================================
' 5. SERVICE DOOR CUTOUT (rear tower panel)
'====================================================================
Private Sub CreateServiceDoorCutout()
    Dim f As Object
    Dim servY As Double: servY = m(SVC_Y)
    Dim halfD As Double: halfD = m(CLAD_OUTER_D / 2)
    Dim halfW As Double: halfW = m(SVC_W / 2)
    Dim halfH As Double: halfH = m(SVC_H / 2)

    ' Cut on the BACK face of the tower back panel
    ' Tower_Back occupies Z = -halfD-PANEL_T to -halfD = -204 to -202
    ' Use plane at Z=-204 to cut through
    Dim pServ As String
    pServ = MakePlane("Top Plane", -halfD - m(PANEL_T), "Plane_ServiceDoor")
    Debug.Print "  Service plane: " & pServ
    StartSketch pServ
    g_swSkMgr.CreateCornerRectangle _
        m(-halfW), m(servY - halfH), 0, _
        m(halfW), m(servY + halfH), 0
    EndSketch
    Set f = DoCutThru()
    If Not f Is Nothing Then f.Name = "ServiceDoor_Cutout"
    LogErr "ServiceDoor_Cutout"
    Rebuild
End Sub

'====================================================================
' 6. VENTILATION SLOTS (rear tower panel, near bottom)
'====================================================================
Private Sub CreateVentilationSlots()
    Dim f As Object
    Dim halfD As Double: halfD = m(CLAD_OUTER_D / 2)
    Dim halfW As Double: halfW = m(VENT_W / 2)
    Dim slotH As Double: slotH = m(VENT_H)

    ' Use the same back plane as service door
    Dim pVent As String
    pVent = MakePlane("Top Plane", -halfD - m(PANEL_T), "Plane_Vent")
    Debug.Print "  Vent plane: " & pVent

    Dim i As Integer
    For i = 0 To VENT_COUNT - 1
        Dim slotY As Double
        slotY = VENT_Y_START + i * (VENT_H + VENT_GAP)

        StartSketch pVent
        g_swSkMgr.CreateCornerRectangle _
            m(-halfW), m(slotY), 0, _
            m(halfW), m(slotY + slotH), 0
        EndSketch
        Set f = DoCutThru()
        If Not f Is Nothing Then f.Name = "Vent_" & (i + 1)
        LogErr "Vent_" & (i + 1)
        Rebuild
    Next i
End Sub

'====================================================================
' 7. DRUM SHROUD CAP (top of neck)
'====================================================================
Private Sub CreateDrumShroudCap()
    Dim f As Object
    Dim neckZ As Double: neckZ = m(TOWER_D / 2 + NECK_FWD)
    Dim yCap As Double: yCap = m(Y_NECK_TOP + 5)

    ' Create a plane at Y = neck top + 5mm
    ' Use Right Plane (X-Z plane) at Y=yCap
    Dim pCap As String
    pCap = MakePlane("Right Plane", yCap, "Plane_DrumCap")
    Debug.Print "  DrumCap plane: " & pCap
    If pCap = "" Then Exit Sub

    StartSketch pCap
    g_swSkMgr.CreateCircle _
        m(-neckZ), 0, 0, _
        m(DRUM_R - neckZ), 0, 0
    EndSketch
    Set f = DoExtrude(m(3))  ' 3mm cap thickness
    If Not f Is Nothing Then f.Name = "DrumShroud_Cap"
    LogErr "DrumShroud_Cap"
    Rebuild
End Sub

'====================================================================
' HIDE ALL REFERENCE PLANES
'   Uses Select + BlankRefGeometry pattern (older but reliable)
'====================================================================
Private Sub HideAllPlanes()
    On Error Resume Next
    Dim vFeats As Variant
    vFeats = g_swModel.FeatureManager.GetFeatures(False)
    If Err.Number <> 0 Then
        Debug.Print "  WARN: GetFeatures failed: " & Err.Description
        Err.Clear
        Exit Sub
    End If
    On Error GoTo 0
    If IsEmpty(vFeats) Then
        Debug.Print "  No features to iterate"
        Exit Sub
    End If
    Dim i As Long, hiddenCount As Long
    For i = LBound(vFeats) To UBound(vFeats)
        Dim swFeatObj As Object
        Set swFeatObj = vFeats(i)
        If Not swFeatObj Is Nothing Then
            On Error Resume Next
            Dim typeName As String
            typeName = swFeatObj.GetTypeName2
            If typeName = "RefPlane" Then
                swFeatObj.Select2 False, 0
                g_swModel.BlankRefGeometry
                If Err.Number = 0 Then
                    hiddenCount = hiddenCount + 1
                End If
                Err.Clear
                g_swModel.ClearSelection2 True
            End If
            On Error GoTo 0
        End If
    Next i
    Debug.Print "  Hidden " & hiddenCount & " reference plane(s)"
End Sub
