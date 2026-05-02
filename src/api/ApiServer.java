package api;

import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.util.List;
import java.util.ArrayList;
import java.util.Collections;
import java.net.InetAddress;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import main.Main;
import report.ReportGenerator;

public class ApiServer {
    
    static class RegisteredEmployee {
        String ip;
        String name;
        public RegisteredEmployee(String ip, String name) { this.ip = ip; this.name = name; }
    }
    
    private static List<RegisteredEmployee> registeredEmployees = Collections.synchronizedList(new ArrayList<>());

    public void startServer() throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(3000), 0);
        
        server.createContext("/api/engagement", new EngagementHandler());
        server.createContext("/api/alerts", new AlertsHandler());
        server.createContext("/api/analytics", new AnalyticsHandler());
        server.createContext("/api/employee-stats", new EmployeeStatsHandler());
        server.createContext("/api/export", new ExportHandler());
        server.createContext("/api/stop", new StopHandler());
        server.createContext("/api/start", new StartHandler());
        server.createContext("/api/register", new RegisterHandler());
        server.createContext("/api/employees", new EmployeesHandler());
        server.createContext("/api/connect", new ConnectHandler());
        server.setExecutor(java.util.concurrent.Executors.newCachedThreadPool());
        server.start();
        System.out.println("API Server started on port 3000!");
    }

    class RegisterHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                addCorsHeaders(exchange);
                exchange.sendResponseHeaders(204, -1);
                exchange.close();
                return;
            }
            if ("POST".equals(exchange.getRequestMethod())) {
                InputStream is = exchange.getRequestBody();
                String body = new String(is.readAllBytes());
                try {
                    String ip = body.split("\"ip\":\"")[1].split("\"")[0];
                    String name = body.split("\"name\":\"")[1].split("\"")[0];
                    boolean exists = false;
                    for (RegisteredEmployee e : registeredEmployees) {
                        if (e.ip.equals(ip)) { e.name = name; exists = true; break; }
                    }
                    if (!exists) registeredEmployees.add(new RegisteredEmployee(ip, name));
                    sendResponse(exchange, "{\"success\": true}");
                } catch (Exception e) {
                    exchange.sendResponseHeaders(400, -1);
                    exchange.close();
                }
            }
        }
    }

    class EmployeesHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                addCorsHeaders(exchange);
                exchange.sendResponseHeaders(204, -1);
                exchange.close();
                return;
            }
            StringBuilder json = new StringBuilder("[");
            for (int i = 0; i < registeredEmployees.size(); i++) {
                RegisteredEmployee emp = registeredEmployees.get(i);
                json.append("{\"ip\":\"").append(emp.ip).append("\", \"name\":\"").append(emp.name).append("\"}");
                if (i < registeredEmployees.size() - 1) json.append(",");
            }
            json.append("]");
            sendResponse(exchange, json.toString());
        }
    }

    class ConnectHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                addCorsHeaders(exchange);
                exchange.sendResponseHeaders(204, -1);
                exchange.close();
                return;
            }
            if ("POST".equals(exchange.getRequestMethod())) {
                InputStream is = exchange.getRequestBody();
                String body = new String(is.readAllBytes());
                try {
                    String managerIp = body.split("\"managerIp\":\"")[1].split("\"")[0];
                    String localIp = InetAddress.getLocalHost().getHostAddress();
                    
                    URL url = new URL("http://" + managerIp + ":3000/api/register");
                    HttpURLConnection con = (HttpURLConnection) url.openConnection();
                    con.setRequestMethod("POST");
                    con.setRequestProperty("Content-Type", "application/json");
                    con.setDoOutput(true);
                    
                    String payload = "{\"ip\":\"" + localIp + "\",\"name\":\"Employee123\"}";
                    try(OutputStream os = con.getOutputStream()) {
                        byte[] input = payload.getBytes("utf-8");
                        os.write(input, 0, input.length);
                    }
                    
                    int code = con.getResponseCode();
                    if (code == 200) {
                        sendResponse(exchange, "{\"success\": true, \"localIp\": \"" + localIp + "\"}");
                    } else {
                        throw new Exception("Manager rejected connection");
                    }
                } catch (Exception e) {
                    System.err.println("Failed to connect to manager: " + e.getMessage());
                    sendResponse(exchange, "{\"success\": false, \"error\": \"" + e.getMessage() + "\"}");
                }
            }
        }
    }

    class StopHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                addCorsHeaders(exchange);
                exchange.sendResponseHeaders(204, -1);
                exchange.close();
                return;
            }
            
            Main.stopMonitoring();
            sendResponse(exchange, "{\"success\": true, \"message\": \"Session stopped.\"}");
        }
    }

    class StartHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                addCorsHeaders(exchange);
                exchange.sendResponseHeaders(204, -1);
                exchange.close();
                return;
            }
            
            Main.startMonitoring();
            sendResponse(exchange, "{\"success\": true, \"message\": \"Session started.\"}");
        }
    }

    private void addCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET,POST,OPTIONS,DELETE");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
    }
    
    private void sendResponse(HttpExchange exchange, String response) throws IOException {
        addCorsHeaders(exchange);
        if ("OPTIONS".equals(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            exchange.close();
            return;
        }
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        exchange.sendResponseHeaders(200, response.getBytes().length);
        OutputStream os = exchange.getResponseBody();
        os.write(response.getBytes());
        os.close();
    }

    class EngagementHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                addCorsHeaders(exchange);
                exchange.sendResponseHeaders(204, -1);
                exchange.close();
                return;
            }
            if ("DELETE".equals(exchange.getRequestMethod())) {
                addCorsHeaders(exchange);
                String query = exchange.getRequestURI().getQuery();
                if (query != null && query.startsWith("timestamp=")) {
                    String timestamp = java.net.URLDecoder.decode(query.substring(10), "UTF-8");
                    ReportGenerator.deleteReport(timestamp);
                    exchange.sendResponseHeaders(200, -1);
                } else {
                    exchange.sendResponseHeaders(400, -1);
                }
                return;
            }

            // Retrieve actual JSON Array generated strictly from local file storage removing all placeholders
            StringBuilder combinedJson = new StringBuilder("[");
            String localReports = ReportGenerator.getAllReportsAsJsonArray();
            if (localReports.length() > 2) {
                combinedJson.append(localReports.substring(1, localReports.length() - 1));
            }
            
            // Inject the currently active live session into the array natively
            if (Main.isMonitoringActive() && Main.analyzer.getTotalCount() > 0) {
                double score = Main.analyzer.getAttentionScore();
                String stat = new service.LeechDetector().checkLeech(score);
                report.Report liveReport = new report.Report("ManagerLocal", Main.analyzer.getTotalCount(), Main.analyzer.getFocusedCount(), score, stat, Main.analyzer.getWindowTimeline(), Main.analyzer.getFocusTimeline());
                String liveJson = liveReport.toJson();
                // Inject live flag and strip specific timestamp to help frontend detection
                liveJson = liveJson.replace("\"timestamp\": \"" + liveReport.getTimestamp() + "\"", "\"timestamp\": \"\", \"isLive\": true");
                
                if (combinedJson.length() > 1) combinedJson.append(", ");
                combinedJson.append(liveJson);
            }
            
            // Fetch reports from all registered employees
            for (RegisteredEmployee emp : registeredEmployees) {
                try {
                    URL url = new URL("http://" + emp.ip + ":3000/api/engagement");
                    HttpURLConnection con = (HttpURLConnection) url.openConnection();
                    con.setRequestMethod("GET");
                    con.setConnectTimeout(2000);
                    con.setReadTimeout(2000);
                    if (con.getResponseCode() == 200) {
                        InputStream is = con.getInputStream();
                        String empReports = new String(is.readAllBytes());
                        if (empReports.length() > 2) {
                            if (combinedJson.length() > 1) combinedJson.append(", ");
                            empReports = empReports.replace("\"Employee123\"", "\"" + emp.name + "\"");
                            combinedJson.append(empReports.substring(1, empReports.length() - 1));
                        }
                    }
                } catch (Exception e) {
                    System.err.println("Could not fetch reports from " + emp.ip);
                }
            }
            
            combinedJson.append("]");
            sendResponse(exchange, combinedJson.toString());
        }
    }

    class AlertsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            // Strict < 0.5 threshold logic
            StringBuilder combinedJson = new StringBuilder("[");
            boolean hasLocal = false;
            double score = Main.analyzer.getAttentionScore();
            
            if (Main.isMonitoringActive() && Main.analyzer.getTotalCount() > 0 && score < 0.5) {
                combinedJson.append("\n{ \"name\": \"ManagerLocal\", \"reason\": \"Tracking detected low window focus under 50% (< 0.5)\", \"time\": \"Current Session\" }\n");
                hasLocal = true;
            }
            
            for (RegisteredEmployee emp : registeredEmployees) {
                try {
                    URL url = new URL("http://" + emp.ip + ":3000/api/alerts");
                    HttpURLConnection con = (HttpURLConnection) url.openConnection();
                    con.setRequestMethod("GET");
                    con.setConnectTimeout(2000);
                    con.setReadTimeout(2000);
                    if (con.getResponseCode() == 200) {
                        InputStream is = con.getInputStream();
                        String empAlerts = new String(is.readAllBytes());
                        if (empAlerts.length() > 2) {
                            if (hasLocal || combinedJson.length() > 1) combinedJson.append(", ");
                            empAlerts = empAlerts.replace("\"Employee123\"", "\"" + emp.name + "\"");
                            combinedJson.append(empAlerts.substring(1, empAlerts.length() - 1));
                            hasLocal = true;
                        }
                    }
                } catch (Exception e) {}
            }
            
            combinedJson.append("]");
            sendResponse(exchange, combinedJson.toString());
        }
    }

    class AnalyticsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            int focused = Main.analyzer.getFocusedCount();
            int total = Main.analyzer.getTotalCount();
            int unfocused = total - focused;
            
            List<Integer> history = Main.analyzer.getFocusHistory();
            String historyData = history.toString();
            String timeLabels = "[";
            for(int i=0; i<history.size(); i++) {
                timeLabels += "\"" + (i*10) + "s\"" + (i < history.size()-1 ? "," : "");
            }
            timeLabels += "]";

            String json = "{\n" +
                "\"windowFocus\": [" + focused + ", " + unfocused + ", 0],\n" +
                "\"chatActivity\": [0, 0, 0, 0, 0, 0],\n" +
                "\"speakingTime\": " + timeLabels + ",\n" +
                "\"speakingData\": " + historyData + "\n" +
            "}";
            sendResponse(exchange, json);
        }
    }

    class EmployeeStatsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            int score = Main.isMonitoringActive() ? (int)Math.round(Main.analyzer.getAttentionScore() * 100) : 0;
            int focus = Main.isMonitoringActive() ? score : 0;
            String status = Main.isMonitoringActive() ? "Active Monitoring Session (40m limit)" : "Session Stopped";
            String json = "{\n" +
                "\"score\": " + score + ",\n" +
                "\"focus\": " + focus + ",\n" +
                "\"chat\": 0,\n" + // Set unused dimensions to 0 to prevent displaying fake data
                "\"speaking\": 0,\n" +
                "\"meetingStatus\": \"" + status + "\"\n" +
            "}";
            sendResponse(exchange, json);
        }
    }

    class ExportHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                addCorsHeaders(exchange);
                exchange.sendResponseHeaders(204, -1);
                exchange.close();
                return;
            }
            addCorsHeaders(exchange);
            exchange.getResponseHeaders().add("Content-Type", "text/csv");
            exchange.getResponseHeaders().add("Content-Disposition", "attachment; filename=\"report.csv\"");
            
            // Fetch aggregated reports via local API call to include remote employees
            String jsonArray = "[]";
            try {
                URL url = new URL("http://localhost:3000/api/engagement");
                HttpURLConnection con = (HttpURLConnection) url.openConnection();
                con.setRequestMethod("GET");
                if (con.getResponseCode() == 200) {
                    jsonArray = new String(con.getInputStream().readAllBytes());
                }
            } catch (Exception e) {
                jsonArray = ReportGenerator.getAllReportsAsJsonArray();
            }
            
            // Generate basic CSV dynamically (Hack method: splitting JSON without Jackson for speed since it's raw format)
            String csv = "Name,Role,Score,Status,TotalChecks,FocusedChecks,Timestamp,ActivitySummary\n";
            String[] reports = jsonArray.split("\"name\": \"");
            for(int i = 1; i < reports.length; i++) {
                String block = reports[i];
                try {
                    String name = block.split("\"", 2)[0];
                    String scoreStr = block.split("\"score\": ")[1].split(",")[0].trim();
                    String statusStr = block.split("\"status\": \"")[1].split("\"", 2)[0];
                    String totCheck = block.split("\"totalChecks\": ")[1].split(",")[0].trim();
                    String focCheck = block.split("\"focusedChecks\": ")[1].split(",")[0].trim();
                    String timestamp = block.split("\"timestamp\": \"")[1].split("\"", 2)[0];
                    String timeline = "";
                    if (block.contains("\"timeline\": [")) {
                        String extracted = block.split("\"timeline\": \\[")[1];
                        int endIdx = extracted.lastIndexOf("]}");
                        if (endIdx != -1) {
                            extracted = extracted.substring(0, endIdx);
                        } else {
                            endIdx = extracted.lastIndexOf("]");
                            if (endIdx != -1) extracted = extracted.substring(0, endIdx);
                        }
                        timeline = extracted.replace("\r", "").replace("\n", "").replace(",", ";").replace("\"", "'").replace("  ", " ");
                    }
                    csv += name + ",Employee," + scoreStr + "," + statusStr + "," + totCheck + "," + focCheck + "," + timestamp + "," + timeline + "\n";
                } catch (Exception e) {
                    System.err.println("Error parsing report block for export: " + e.getMessage());
                }
            }
            
            exchange.sendResponseHeaders(200, csv.getBytes().length);
            OutputStream os = exchange.getResponseBody();
            os.write(csv.getBytes());
            os.close();
        }
    }
}
