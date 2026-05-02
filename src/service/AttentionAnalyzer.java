package service;

import java.util.ArrayList;
import java.util.List;

public class AttentionAnalyzer {

    private int focusedCount = 0;
    private int totalCount = 0;
    private List<Integer> focusHistory = new ArrayList<>();
    private List<String> windowTimeline = new ArrayList<>();
    private List<Boolean> focusTimeline = new ArrayList<>();

    public void analyzeWindow(String window) {
        if (window == null) window = "Unknown Window";
        totalCount++;

        boolean isFocused = false;
        
        // Strict matching for valid applications
        // Must exclude internally tracked dashboards
        if (!window.contains("Meeting Leech Detector")) {
            if (window.contains("Google Meet")
             || window.contains("Zoom Meeting")
             || window.contains("Microsoft Teams")
             || window.contains("PowerPoint Slide Show")) 
            {
                isFocused = true;
            }
        }

        if (isFocused) {
            focusedCount++;
            focusHistory.add(100); 
        } else {
            focusHistory.add(0); 
        }
        
        // Strictly escape JSON breaking characters
        String escapedWindow = window.replace("\\", "\\\\")
                                     .replace("\"", "\\\"")
                                     .replace("\n", " ")
                                     .replace("\r", " ")
                                     .replace("\t", " ");
                                     
        windowTimeline.add(escapedWindow);
        focusTimeline.add(isFocused);
    }

    public double getAttentionScore() {
        if(totalCount == 0) return 0;
        return (double) focusedCount / totalCount;
    }
    
    public int getFocusedCount() {
        return focusedCount;
    }
    
    public int getTotalCount() {
        return totalCount;
    }
    
    public List<Integer> getFocusHistory() {
        return focusHistory;
    }
    
    public List<String> getWindowTimeline() {
        return windowTimeline;
    }
    
    public List<Boolean> getFocusTimeline() {
        return focusTimeline;
    }
    
    public void reset() {
        focusedCount = 0;
        totalCount = 0;
        focusHistory.clear();
        windowTimeline.clear();
        focusTimeline.clear();
    }
}