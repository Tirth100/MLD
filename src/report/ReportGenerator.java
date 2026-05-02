package report;

import java.io.*;
import java.util.ArrayList;
import java.util.List;

public class ReportGenerator {

    private static final String DB_FILE = "reports_db.txt";

    public static void saveReport(Report report) {
        // Convert to minified json for safe single-line storage
        String minifiedJson = report.toJson().replace("\n", "").replaceAll("  ", "");
        
        try (FileWriter fw = new FileWriter(DB_FILE, true);
             BufferedWriter bw = new BufferedWriter(fw);
             PrintWriter out = new PrintWriter(bw)) {
            
            out.println(minifiedJson);
            System.out.println("Report saved to database successfully.");
        } catch (IOException e) {
            System.err.println("Error saving report: " + e.getMessage());
        }
    }

    public static String getAllReportsAsJsonArray() {
        List<String> lines = new ArrayList<>();
        File file = new File(DB_FILE);
        if(!file.exists()) {
            return "[]";
        }
        
        try (BufferedReader br = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = br.readLine()) != null) {
                if(!line.trim().isEmpty()){
                    lines.add(line);
                }
            }
        } catch (IOException e) {
            System.err.println("Error reading reports: " + e.getMessage());
            return "[]";
        }
        
        return "[" + String.join(", ", lines) + "]";
    }

    public static void deleteReport(String timestamp) {
        File file = new File(DB_FILE);
        if (!file.exists()) return;
        
        List<String> lines = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = br.readLine()) != null) {
                if (!line.trim().isEmpty() && !line.contains("\"timestamp\": \"" + timestamp + "\"")) {
                    lines.add(line);
                }
            }
        } catch (IOException e) {
            System.err.println("Error reading reports for deletion: " + e.getMessage());
            return;
        }
        
        try (FileWriter fw = new FileWriter(DB_FILE, false);
             BufferedWriter bw = new BufferedWriter(fw);
             PrintWriter out = new PrintWriter(bw)) {
            
            for (String l : lines) {
                out.println(l);
            }
        } catch (IOException e) {
            System.err.println("Error saving after deletion: " + e.getMessage());
        }
    }
}
