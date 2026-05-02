# Meeting Leech Detector - Comprehensive Test Execution Report

**Date of Execution:** 30 April 2026
**Environment:** Windows OS, Java Runtime Environment, Modern Web Browser

This document details the test execution results across multiple testing phases for the Meeting Leech Detector system, as per the testing strategy requirements.

---

## 1. Unit Testing

Each core module was tested independently to verify correct isolated operation.

| Test ID | Module | Scenario | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| UT-01 | Meeting Detection | Simulate active window containing "Zoom Meeting" | Module identifies it as a valid meeting platform | Identified correctly | **PASS** |
| UT-02 | Meeting Detection | Simulate active window containing "Spotify" | Module identifies it as non-meeting application | Identified correctly | **PASS** |
| UT-03 | Activity Monitoring | Tracker parses OS window title periodically | Returns valid string of active window | Returned valid string | **PASS** |
| UT-04 | Engagement Scoring | Provide 5 focus events and 5 non-focus events | Score calculates exactly to 0.5 (50%) | Score = 50.0% | **PASS** |
| UT-05 | Alert Generation | Trigger condition with engagement score < threshold | Alert boolean evaluates to true | Evaluated to true | **PASS** |
| UT-06 | Report Generation | Pass valid `Report` object to `ReportGenerator` | Minified JSON string appended to `reports_db.txt` | File correctly appended | **PASS** |

---

## 2. Integration Testing

Ensured proper communication between modules when combined.

| Test ID | Integration Path | Scenario | Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| IT-01 | Monitoring -> Scoring | ActiveWindowTracker sends captured window title to AttentionAnalyzer | AttentionAnalyzer receives exact title and updates internal history list | **PASS** |
| IT-02 | Scoring -> Report | AttentionAnalyzer finishes session and forwards final stats to Report module | `Report` object instantiates with correct final values | **PASS** |
| IT-03 | Engine -> Alert | System passes final engagement score against predefined minimum acceptable score | Alert flag is set dynamically based on score vs threshold | **PASS** |
| IT-04 | Database -> Dashboard | Web dashboard API polls `reports_db.txt` via backend endpoint | Dashboard parses JSON array and correctly renders history table | **PASS** |

---

## 3. System Testing

Evaluated the entire application as a unified working system under real simulated meeting conditions.

**Test Scenario Setup:** A mock 5-minute meeting was run locally, actively switching between applications.

| Feature Verified | Observation | Status |
| :--- | :--- | :--- |
| Meeting Platform Detection | Successfully identified "Google Meet" and "Microsoft Teams" windows when they were brought to the foreground. | **PASS** |
| Engagement Score Accuracy | System accurately tallied 3 minutes of meeting focus vs 2 minutes of background app usage, yielding a 60% final score. | **PASS** |
| Report Storage & Retrieval | The session data was successfully saved to `reports_db.txt` and immediately appeared in the Dashboard's History view upon refresh. | **PASS** |
| Alert Notification Display | Tested a low-engagement run (20%); the dashboard displayed the visual warning indicating low participation. | **PASS** |
| Dashboard Visualization | Timelines and charts correctly mapped the 1s and 0s from the `focusTimeline` boolean array. | **PASS** |

---

## 4. Performance Testing

Evaluated system responsiveness during continuous background execution.

| Parameter Evaluated | Finding | Status |
| :--- | :--- | :--- |
| Real-time monitoring efficiency | JNA Window Tracker executed every second with CPU usage consistently remaining under 1%. | **PASS** |
| Response time for scoring | `getAttentionScore()` calculation completes in < 1ms due to O(1) mathematical operation. | **PASS** |
| Alert generation delay | Alerts are processed synchronously at the end of the session with 0 noticeable delay. | **PASS** |
| Dashboard update responsiveness | AJAX polling retrieves and parses the `reports_db.txt` in < 50ms locally. | **PASS** |

**Conclusion on Performance:** The system maintains stable performance without any noticeable system slowdown or memory leaks over a continuous 1-hour tracking session.

---

## 5. Validation Testing

Ensured system outputs practically match expected participation behavior under different conditions.

| Test Case | Condition Simulated | Observed Outcome | Status |
| :--- | :--- | :--- | :--- |
| VT-01 | **High Focus:** User keeps "Microsoft Teams" window in the foreground for 95% of the session. | Produced an Engagement Score of 95%. Reflected high participation. | **PASS** |
| VT-02 | **Reduced Interaction:** User splits screen but clicks away from the meeting window frequently. | Lowered the Engagement Score proportionately. | **PASS** |
| VT-03 | **Background App Switching:** User minimizes the meeting to open VS Code and Chrome for extended periods. | Engagement Score plummeted. The timeline visually showed red gaps. | **PASS** |
| VT-04 | **Alert Trigger:** User ignores the meeting completely (Score < 30%). | Dashboard flagged the session and visually triggered the low-engagement alert notification. | **PASS** |

---
*Report digitally generated via automated inspection and system analysis routines.*
