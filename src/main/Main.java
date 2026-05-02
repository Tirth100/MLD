package main;

import api.ApiServer;
import monitor.ActiveWindowTracker;
import service.AttentionAnalyzer;
import service.LeechDetector;
import report.Report;

import java.io.IOException;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class Main {

    public static AttentionAnalyzer analyzer = new AttentionAnalyzer();
    private static int currentIteration = 0;
    private static final int MAX_ITERATIONS = 240; // 40 minutes at 10s intervals
    private static ScheduledExecutorService scheduler;

    public static void startMonitoring() {
        if (scheduler == null || scheduler.isShutdown()) {
            scheduler = Executors.newScheduledThreadPool(1);
            currentIteration = 0;
            analyzer.reset();

            scheduler.scheduleAtFixedRate(() -> {
                if (currentIteration >= MAX_ITERATIONS) {
                    stopMonitoring();
                    return;
                }

                try {
                    String window = ActiveWindowTracker.getActiveWindowTitle();
                    analyzer.analyzeWindow(window);

                    System.out.println(
                            "[Tick " + (currentIteration + 1) + "/" + MAX_ITERATIONS + "] Tracked window: " + window);
                    currentIteration++;
                } catch (Exception e) {
                    System.err.println("Error tracking window: " + e.getMessage());
                }
            }, 0, 10, TimeUnit.SECONDS);

            System.out.println("Monitoring session started.");
        }
    }

    public static void stopMonitoring() {
        if (scheduler != null && !scheduler.isShutdown()) {
            System.out.println("\nMonitoring session stopped!");
            double finalScore = analyzer.getAttentionScore();

            // Store the report permanently
            String status = new LeechDetector().checkLeech(finalScore);
            Report sessionReport = new Report("Employee123", analyzer.getTotalCount(), analyzer.getFocusedCount(),
                    finalScore, status, analyzer.getWindowTimeline(), analyzer.getFocusTimeline());
            report.ReportGenerator.saveReport(sessionReport);

            scheduler.shutdown();
            System.out.println("Session saved. Final Score: " + (Math.round(finalScore * 100)) + "%");
        }
    }

    public static boolean isMonitoringActive() {
        return scheduler != null && !scheduler.isShutdown();
    }

    public static void main(String[] args) {

        System.out.println("Starting Meeting Leech Detector Backend...");

        // Start API Server
        try {
            ApiServer server = new ApiServer();
            server.startServer();
        } catch (IOException e) {
            System.err.println("Failed to start API Server: " + e.getMessage());
        }

        // Server started, waiting for manual start from dashboard
    }
}