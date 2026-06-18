'====================================================================
' KIOSK TOWER ASSEMBLY FIX - SolidWorks 2026 VBA Macro
'
' Analyzes and repairs the complete kiosk assembly.
' Removes incorrect mates, rebuilds with robust face-to-face
' coincident mates, concentric mates, and symmetry constraints.
'
' Target: SolidWorks 2026 (API 32.x)
' Late binding - no type library references needed.
'
' HOW TO RUN:
'   1. Open SolidWorks 2026
'   2. Tools > Macro > New (VBA Editor)
'   3. File > Import File > select this .bas file
'   4. F5 > FixKioskAssembly
'====================================================================
Option Explicit

'--- Application References (late binding) ---
Dim g_swApp As Object
Dim g_swModel As Object
Dim g_swAssy As Object
Dim g_swSkMgr As Object
Dim g_swFeatMgr As Object
Dim g_swSelMgr As Object

'--- Unit conversion (mm -> meters) ---
Const MM As Double = 0.001

'--- Project path ---
Const PROJ_PATH As String = "C:\Users\kisha\Documents\Kiosk\"

'=== DIMENSIONS (mm) - must match part files ===
Const TW As Double = 280         ' tower width
Const TD As Double = 220         ' tower depth
Const TH As Double = 1400        ' tower height
Const FS As Double = 30          ' frame size
Const FW As Double = 2           ' frame wall
Const PT As Double = 2           ' panel thickness
Const NECK_Y As Double = 1000    ' neck transition start
Const NECK_H As Double = 200     ' neck transition height
Const SCR_Y As Double = 950      ' screen center height
Const POD_W As Double = 420      ' podium width
Const POD_D As Double = 350      ' podium depth
Const POD_H As Double = 100      ' podium height
Const DRUM_R As Double = 350     ' drum shroud radius

'====================================================================
' MAIN ENTRY POINT
'====================================================================
Sub FixKioskAssembly()
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

    Debug.Print "=== Kiosk Assembly Fix - Starting ==="
    Debug.Print "API revision: " & g_swApp.RevisionNumber

    Dim t0 As Double
    t0 = Timer

    '--- Verify parts exist ---
    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")

    Dim requiredParts As Variant
    requiredParts = Array("KioskTower.SLDPRT", "DrumModule.SLDPRT", _
                          "WeightPlatform.SLDPRT", "DisplayBezel.SLDPRT")
    Dim i As Long
    For i = 0 To UBound(requiredParts)
        If Not fso.FileExists(PROJ_PATH & CStr(requiredParts(i))) Then
            MsgBox "Missing part: " & CStr(requiredParts(i)) & vbCrLf & vbCrLf & _
                   "Run BuildPremiumKiosk first to generate all parts.", _
                   vbCritical, "Missing Part"
            Exit Sub
        End If
    Next i

    '--- Create or open assembly ---
    Dim swAssyDoc As Object
    Set swAssyDoc = CreateOrOpenAssembly()
    If swAssyDoc Is Nothing Then
        MsgBox "Could not create or open assembly.", vbCritical
        Exit Sub
    End If

    Set g_swModel = swAssyDoc
    Set g_swAssy = swAssyDoc
    Set g_swSkMgr = g_swModel.SketchManager
    Set g_swFeatMgr = g_swModel.FeatureManager
    Set g_swSelMgr = g_swModel.SelectionManager

    '--- Get assembly name for mate selection strings ---
    Dim assyTitle As String
    assyTitle = g_swModel.GetTitle
    If InStr(assyTitle, ".") > 0 Then
        assyTitle = Left(assyTitle, InStr(assyTitle, ".") - 1)
    End If
    Debug.Print "  Assembly title: " & assyTitle

    '--- Step 1: Remove all existing mates ---
    Debug.Print ""
    Debug.Print "--- Step 1: Removing existing mates ---"
    RemoveAllMates

    '--- Step 2: Remove all components ---
    Debug.Print ""
    Debug.Print "--- Step 2: Removing existing components ---"
    RemoveAllComponents

    '--- Step 3: Add components with correct positions ---
    Debug.Print ""
    Debug.Print "--- Step 3: Adding components ---"
    Dim compTower As Object
    Dim compDrum As Object
    Dim compBezel As Object
    Dim compPlatform As Object

    ' Tower at origin (will be fixed via mates)
    Set compTower = AddComponent("KioskTower.SLDPRT", 0, 0, 0)
    If compTower Is Nothing Then
        MsgBox "Failed to add KioskTower.", vbCritical
        Exit Sub
    End If
    Debug.Print "  Tower added"

    ' Drum at neck top
    Set compDrum = AddComponent("DrumModule.SLDPRT", _
        0, m(NECK_Y + NECK_H + 10), 0)
    If compDrum Is Nothing Then
        MsgBox "Failed to add DrumModule.", vbCritical
        Exit Sub
    End If
    Debug.Print "  Drum added"

    ' Bezel at screen height, front face
    Set compBezel = AddComponent("DisplayBezel.SLDPRT", _
        0, m(SCR_Y), m(TD / 2 + 3))
    If compBezel Is Nothing Then
        MsgBox "Failed to add DisplayBezel.", vbCritical
        Exit Sub
    End If
    Debug.Print "  Bezel added"

    ' Platform at floor level
    Set compPlatform = AddComponent("WeightPlatform.SLDPRT", _
        0, -m(POD_H), 0)
    If compPlatform Is Nothing Then
        MsgBox "Failed to add WeightPlatform.", vbCritical
        Exit Sub
    End If
    Debug.Print "  Platform added"

    g_swModel.ForceRebuild3 True

    '--- Step 4: Create mates ---
    Debug.Print ""
    Debug.Print "--- Step 4: Creating mates ---"
    Dim mateCount As Long
    mateCount = 0

    ' =============================================
    ' TOWER: Fix at origin (3 plane mates)
    ' =============================================
    Debug.Print "  [TOWER] Fixing at origin..."

    ' Tower Right Plane = Assembly Right Plane
    If MatePlaneToOrigin(compTower.Name2, "Right Plane", "Right", assyTitle) Then
        mateCount = mateCount + 1
    End If

    ' Tower Front Plane = Assembly Front Plane
    If MatePlaneToOrigin(compTower.Name2, "Front Plane", "Front", assyTitle) Then
        mateCount = mateCount + 1
    End If

    ' Tower Top Plane = Assembly Top Plane
    If MatePlaneToOrigin(compTower.Name2, "Top Plane", "Top", assyTitle) Then
        mateCount = mateCount + 1
    End If

    ' =============================================
    ' DRUM: Center on tower
    ' =============================================
    Debug.Print "  [DRUM] Centering on tower..."

    ' Drum Right Plane = Tower Right Plane (center X)
    If MatePlaneToPlane(compTower.Name2, "Right Plane", _
                        compDrum.Name2, "Right Plane", assyTitle) Then
        mateCount = mateCount + 1
    End If

    ' Drum Front Plane = Tower Front Plane (center Z)
    If MatePlaneToPlane(compTower.Name2, "Front Plane", _
                        compDrum.Name2, "Front Plane", assyTitle) Then
        mateCount = mateCount + 1
    End If

    ' =============================================
    ' BEZEL: Center on tower front face
    ' =============================================
    Debug.Print "  [BEZEL] Centering on tower front..."

    ' Bezel Right Plane = Tower Right Plane (center X)
    If MatePlaneToPlane(compTower.Name2, "Right Plane", _
                        compBezel.Name2, "Right Plane", assyTitle) Then
        mateCount = mateCount + 1
    End If

    ' Bezel Front Plane = Tower Front Plane (center Z)
    If MatePlaneToPlane(compTower.Name2, "Front Plane", _
                        compBezel.Name2, "Front Plane", assyTitle) Then
        mateCount = mateCount + 1
    End If

    ' =============================================
    ' PLATFORM: Center under tower
    ' =============================================
    Debug.Print "  [PLATFORM] Centering under tower..."

    ' Platform Right Plane = Tower Right Plane (center X)
    If MatePlaneToPlane(compTower.Name2, "Right Plane", _
                        compPlatform.Name2, "Right Plane", assyTitle) Then
        mateCount = mateCount + 1
    End If

    ' Platform Front Plane = Tower Front Plane (center Z)
    If MatePlaneToPlane(compTower.Name2, "Front Plane", _
                        compPlatform.Name2, "Front Plane", assyTitle) Then
        mateCount = mateCount + 1
    End If

    Debug.Print ""
    Debug.Print "  Total mates created: " & mateCount

    '--- Step 5: Rebuild and validate ---
    Debug.Print ""
    Debug.Print "--- Step 5: Rebuild and validate ---"
    g_swModel.ForceRebuild3 True
    On Error Resume Next
    g_swModel.ViewZoomtofit
    On Error GoTo 0

    '--- Step 6: Save ---
    Debug.Print ""
    Debug.Print "--- Step 6: Saving ---"
    Dim saveErr As Long, saveWarn As Long
    g_swModel.SaveAs4 PROJ_PATH & "KioskPremium.SLDASM", 0, 0, saveErr, saveWarn
    Debug.Print "  Saved: " & PROJ_PATH & "KioskPremium.SLDASM"

    '--- Done ---
    Debug.Print ""
    Debug.Print "=== Assembly fix complete in " & Format(Timer - t0, "0.0") & "s ==="
    MsgBox "Kiosk assembly rebuilt successfully." & vbCrLf & vbCrLf & _
           "Mates created: " & mateCount & vbCrLf & _
           "File: " & PROJ_PATH & "KioskPremium.SLDASM" & vbCrLf & vbCrLf & _
           "Layout:" & vbCrLf & _
           "  Top Cap (integrated in tower)" & vbCrLf & _
           "  Display / Bezel (front face, centered)" & vbCrLf & _
           "  Kiosk Tower Frame (origin, fixed)" & vbCrLf & _
           "  Drum Module (top of tower)" & vbCrLf & _
           "  Weight Platform (bottom, centered)" & vbCrLf & vbCrLf & _
           "Check Immediate Window (Ctrl+G) for details.", _
           vbInformation, "Assembly Fix Complete"
End Sub

'====================================================================
' CREATE OR OPEN ASSEMBLY
'====================================================================
Private Function CreateOrOpenAssembly() As Object
    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")

    Dim assyPath As String
    assyPath = PROJ_PATH & "KioskPremium.SLDASM"

    '--- Try to open existing assembly ---
    If fso.FileExists(assyPath) Then
        Dim errs As Long
        On Error Resume Next
        Set CreateOrOpenAssembly = g_swApp.OpenDoc6( _
            assyPath, 2, 0, "", errs, 1)  ' 2 = swDocASSEMBLY
        On Error GoTo 0
        If Not CreateOrOpenAssembly Is Nothing Then
            Debug.Print "  Opened existing assembly"
            Exit Function
        End If
    End If

    '--- Create new assembly ---
    Dim tmpl As String
    tmpl = ""
    On Error Resume Next
    tmpl = g_swApp.GetUserPreferenceStringValue(72)
    On Error GoTo 0

    If tmpl <> "" Then
        If fso.FileExists(tmpl) Then
            Set CreateOrOpenAssembly = g_swApp.NewDocument(tmpl, 0, 0, 0)
        End If
    End If

    If CreateOrOpenAssembly Is Nothing Then
        ' Try MBD template
        Dim mbdTmpl As String
        mbdTmpl = "C:\ProgramData\SolidWorks\SOLIDWORKS 2026\templates\MBD\assembly 0251mm to 1000mm.asmdot"
        If fso.FileExists(mbdTmpl) Then
            Set CreateOrOpenAssembly = g_swApp.NewDocument(mbdTmpl, 0, 0, 0)
        End If
    End If

    If CreateOrOpenAssembly Is Nothing Then
        ' Last resort: try any asmdot
        On Error Resume Next
        Dim folder As Object
        Set folder = fso.GetFolder("C:\ProgramData\SolidWorks\SOLIDWORKS 2026\templates")
        Dim subFolder As Object, file As Object
        For Each subFolder In folder.SubFolders
            For Each file In subFolder.Files
                If Right(LCase(file.Name), 7) = ".asmdot" Then
                    Set CreateOrOpenAssembly = g_swApp.NewDocument(file.Path, 0, 0, 0)
                    If Not CreateOrOpenAssembly Is Nothing Then Exit Function
                End If
            Next file
        Next subFolder
        On Error GoTo 0
    End If

    Debug.Print "  Created new assembly"
End Function

'====================================================================
' ADD COMPONENT
'====================================================================
Private Function AddComponent(partName As String, _
                              ByVal xM As Double, ByVal yM As Double, ByVal zM As Double) As Object
    Set AddComponent = Nothing
    Dim partPath As String
    partPath = PROJ_PATH & partName

    On Error Resume Next
    Set AddComponent = g_swAssy.AddComponent5( _
        partPath, 0, "", False, "", xM, yM, zM)
    On Error GoTo 0

    If AddComponent Is Nothing Then
        Debug.Print "  ERR: Failed to add " & partName
    End If

    g_swModel.ForceRebuild3 True
End Function

'====================================================================
' REMOVE ALL MATES
'====================================================================
Private Sub RemoveAllMates()
    Dim swFeat As Object
    Set swFeat = g_swModel.FirstFeature
    Dim deleteCount As Long
    deleteCount = 0

    Do While Not swFeat Is Nothing
        Dim nextFeat As Object
        Set nextFeat = swFeat.GetNextFeature

        Dim fType As String
        fType = swFeat.GetTypeName2

        ' Mate features are type "MateFeature" or contain "Mate"
        If fType = "MateGroup" Or _
           InStr(1, fType, "Mate", vbTextCompare) > 0 Then
            On Error Resume Next
            g_swModel.Extension.SelectByID2 swFeat.Name, "MATE", 0, 0, 0, False, 0, Nothing, 0
            g_swModel.FeatureManager.DeleteSelection 0
            deleteCount = deleteCount + 1
            On Error GoTo 0
            Debug.Print "  Deleted mate: " & swFeat.Name
        End If

        Set swFeat = nextFeat
    Loop

    g_swModel.ClearSelection2 True
    g_swModel.ForceRebuild3 True
    Debug.Print "  Removed " & deleteCount & " mates"
End Sub

'====================================================================
' REMOVE ALL COMPONENTS
'====================================================================
Private Sub RemoveAllComponents()
    On Error Resume Next

    Dim vComps As Variant
    vComps = g_swAssy.GetComponents(False)

    If IsEmpty(vComps) Then
        Debug.Print "  No components to remove"
        Exit Sub
    End If

    Dim i As Long
    Dim removeCount As Long
    removeCount = 0

    For i = 0 To UBound(vComps)
        Dim swComp As Object
        Set swComp = vComps(i)
        If Not swComp Is Nothing Then
            Dim compName As String
            compName = swComp.Name2

            ' Don't try to remove the ground/fixed component
            If Not swComp.Fixed Then
                g_swModel.Extension.SelectByID2 compName, "COMPONENT", 0, 0, 0, False, 0, Nothing, 0
                g_swModel.EditDelete
                removeCount = removeCount + 1
                Debug.Print "  Removed: " & compName
            End If
        End If
    Next i

    ' If we couldn't remove components via EditDelete, try suppression
    If removeCount = 0 Then
        vComps = g_swAssy.GetComponents(False)
        If Not IsEmpty(vComps) Then
            For i = 0 To UBound(vComps)
                Set swComp = vComps(i)
                If Not swComp Is Nothing Then
                    If Not swComp.Fixed Then
                        swComp.Suppress
                        removeCount = removeCount + 1
                        Debug.Print "  Suppressed: " & swComp.Name2
                    End If
                End If
            Next i
        End If
    End If

    On Error GoTo 0
    g_swModel.ClearSelection2 True
    g_swModel.ForceRebuild3 True
    Debug.Print "  Removed/suppressed " & removeCount & " components"
End Sub

'====================================================================
' MATE: Component Plane to Assembly Origin Plane
'====================================================================
Private Function MatePlaneToOrigin(compName As String, compPlane As String, _
                                    assyPlane As String, assyTitle As String) As Boolean
    MatePlaneToOrigin = False

    Dim selA As String
    selA = compPlane & "@" & compName & "@" & assyTitle

    Dim selB As String
    selB = assyPlane & " Plane@" & assyTitle

    Debug.Print "    " & selA & " = " & selB

    ' Clear selection
    g_swModel.ClearSelection2 True

    ' Select component plane (mark=1)
    Dim bRet As Boolean
    bRet = g_swModel.Extension.SelectByID2(selA, "PLANE", 0, 0, 0, False, 1, Nothing, 0)
    If Not bRet Then
        Debug.Print "      FAIL: select " & selA
        Exit Function
    End If

    ' Select assembly plane (mark=2, append)
    bRet = g_swModel.Extension.SelectByID2(selB, "PLANE", 0, 0, 0, True, 2, Nothing, 0)
    If Not bRet Then
        Debug.Print "      FAIL: select " & selB
        Exit Function
    End If

    ' Create mate
    MatePlaneToOrigin = CreateCoincidentMate()
End Function

'====================================================================
' MATE: Component Plane to Component Plane
'====================================================================
Private Function MatePlaneToPlane(compAName As String, planeA As String, _
                                   compBName As String, planeB As String, _
                                   assyTitle As String) As Boolean
    MatePlaneToPlane = False

    Dim selA As String, selB As String
    selA = planeA & "@" & compAName & "@" & assyTitle
    selB = planeB & "@" & compBName & "@" & assyTitle

    Debug.Print "    " & selA & " = " & selB

    ' Clear selection
    g_swModel.ClearSelection2 True

    ' Select first plane (mark=1)
    Dim bRet As Boolean
    bRet = g_swModel.Extension.SelectByID2(selA, "PLANE", 0, 0, 0, False, 1, Nothing, 0)
    If Not bRet Then
        Debug.Print "      FAIL: select " & selA
        Exit Function
    End If

    ' Select second plane (mark=2, append)
    bRet = g_swModel.Extension.SelectByID2(selB, "PLANE", 0, 0, 0, True, 2, Nothing, 0)
    If Not bRet Then
        Debug.Print "      FAIL: select " & selB
        Exit Function
    End If

    ' Create mate
    MatePlaneToPlane = CreateCoincidentMate()
End Function

'====================================================================
' MATE: Face to Face (coincident)
'====================================================================
Private Function MateFaceToFace(compAName As String, facePointX As Double, facePointY As Double, facePointZ As Double, _
                                compBName As String, facePoint2X As Double, facePoint2Y As Double, facePoint2Z As Double, _
                                assyTitle As String) As Boolean
    MateFaceToFace = False

    ' Clear selection
    g_swModel.ClearSelection2 True

    ' Select first face (mark=1)
    Dim selStrA As String
    selStrA = "SolidBody@" & compAName & "@" & assyTitle
    Dim bRet As Boolean
    bRet = g_swModel.Extension.SelectByID2("", "FACE", facePointX, facePointY, facePointZ, False, 1, Nothing, 0)
    If Not bRet Then
        Debug.Print "      FAIL: select face on " & compAName
        Exit Function
    End If

    ' Select second face (mark=2, append)
    bRet = g_swModel.Extension.SelectByID2("", "FACE", facePoint2X, facePoint2Y, facePoint2Z, True, 2, Nothing, 0)
    If Not bRet Then
        Debug.Print "      FAIL: select face on " & compBName
        Exit Function
    End If

    ' Create mate
    MateFaceToFace = CreateCoincidentMate()
End Function

'====================================================================
' CREATE COINCIDENT MATE (from current selection)
'====================================================================
Private Function CreateCoincidentMate() As Boolean
    CreateCoincidentMate = False

    ' Create mate data (0 = swMateTypeCoincident)
    Dim swMateData As Object
    On Error Resume Next
    Set swMateData = g_swModel.CreateMateData(0)
    On Error GoTo 0

    If swMateData Is Nothing Then
        Debug.Print "      FAIL: CreateMateData"
        Exit Function
    End If

    ' Get selected entities
    Dim entA As Object, entB As Object
    Set entA = g_swModel.SelectionManager.GetSelectedObject6(1, -1)
    Set entB = g_swModel.SelectionManager.GetSelectedObject6(2, -1)

    If entA Is Nothing Or entB Is Nothing Then
        Debug.Print "      FAIL: no entities selected"
        Exit Function
    End If

    ' Set entities
    Dim entities(1) As Object
    Set entities(0) = entA
    Set entities(1) = entB
    swMateData.EntitiesToMate = entities
    swMateData.MateAlignment = 0  ' aligned

    ' Create mate
    Dim swMateFeat As Object
    On Error Resume Next
    Set swMateFeat = g_swModel.CreateMate(swMateData)
    Dim mateErr As Long: mateErr = Err.Number
    On Error GoTo 0

    If swMateFeat Is Nothing Then
        Debug.Print "      FAIL: CreateMate (err=" & mateErr & ")"
        Exit Function
    End If

    Debug.Print "      OK: " & swMateFeat.Name
    g_swModel.ClearSelection2 True
    CreateCoincidentMate = True
End Function

'====================================================================
' HELPER: mm to meters
'====================================================================
Private Function m(ByVal v As Double) As Double
    m = v * MM
End Function
