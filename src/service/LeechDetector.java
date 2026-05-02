package service;

public class LeechDetector {

    public String checkLeech(double attentionScore) {
        if(attentionScore > 0.75) {
            return "engaging";
        }
        else if(attentionScore > 0.5) {
            return "neutral";
        }
        else {
            return "leeching";
        }
    }
}