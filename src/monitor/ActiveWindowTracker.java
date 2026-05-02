package monitor;

import com.sun.jna.Native;
import com.sun.jna.platform.win32.User32;
import com.sun.jna.platform.win32.WinDef;
import com.sun.jna.platform.win32.WinUser;

public class ActiveWindowTracker {

    public static String getActiveWindowTitle() {

        char[] windowText = new char[512];

        WinDef.HWND hwnd = User32.INSTANCE.GetForegroundWindow();

        User32.INSTANCE.GetWindowText(hwnd, windowText, 512);

        return Native.toString(windowText);
    }
}