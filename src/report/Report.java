package report;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

public class Report {
    private String username;
    private int totalChecks;
    private int focusedChecks;
    private double attentionScore;
    private String participationLevel;
    private String timestamp;
    private List<String> windowTimeline;
    private List<Boolean> focusTimeline;

    public Report(String username, int totalChecks, int focusedChecks, double attentionScore, String participationLevel, List<String> windowTimeline, List<Boolean> focusTimeline) {
        this.username = username;
        this.totalChecks = totalChecks;
        this.focusedChecks = focusedChecks;
        this.attentionScore = attentionScore;
        this.participationLevel = participationLevel;
        this.timestamp = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());
        this.windowTimeline = windowTimeline;
        this.focusTimeline = focusTimeline;
    }

    // Constructor used for deserializing basic fields if needed
    public Report(String username, int totalChecks, int focusedChecks, double attentionScore, String participationLevel, String timestamp) {
        this.username = username;
        this.totalChecks = totalChecks;
        this.focusedChecks = focusedChecks;
        this.attentionScore = attentionScore;
        this.participationLevel = participationLevel;
        this.timestamp = timestamp;
    }

    public String getUsername() { return username; }
    public int getTotalChecks() { return totalChecks; }
    public int getFocusedChecks() { return focusedChecks; }
    public double getAttentionScore() { return attentionScore; }
    public String getParticipationLevel() { return participationLevel; }
    public String getTimestamp() { return timestamp; }
    public List<String> getWindowTimeline() { return windowTimeline; }
    public List<Boolean> getFocusTimeline() { return focusTimeline; }

    public String toJson() {
        StringBuilder sb = new StringBuilder();
        sb.append("{\n");
        sb.append("  \"name\": \"").append(username).append("\",\n");
        sb.append("  \"role\": \"Local System User\",\n");
        sb.append("  \"score\": ").append(Math.round(attentionScore * 100)).append(",\n");
        sb.append("  \"status\": \"").append(participationLevel).append("\",\n");
        sb.append("  \"totalChecks\": ").append(totalChecks).append(",\n");
        sb.append("  \"focusedChecks\": ").append(focusedChecks).append(",\n");
        sb.append("  \"timestamp\": \"").append(timestamp).append("\",\n");
        
        // Add timeline
        sb.append("  \"timeline\": [\n");
        if (windowTimeline != null && focusTimeline != null) {
            for (int i = 0; i < windowTimeline.size(); i++) {
                sb.append("    { ");
                sb.append("\"window\": \"").append(windowTimeline.get(i)).append("\", ");
                sb.append("\"focused\": ").append(focusTimeline.get(i));
                sb.append(" }");
                if (i < windowTimeline.size() - 1) {
                    sb.append(",");
                }
                sb.append("\n");
            }
        }
        sb.append("  ]\n");
        sb.append("}");
        return sb.toString();
    }
}
