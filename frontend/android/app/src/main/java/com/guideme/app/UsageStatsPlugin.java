package com.guideme.app;

import android.app.AppOpsManager;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.os.Process;
import android.provider.Settings;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Calendar;
import java.util.Map;

@CapacitorPlugin(name = "UsageStatsPlugin")
public class UsageStatsPlugin extends Plugin {

    @PluginMethod
    public void hasUsagePermission(PluginCall call) {
        try {
            Context context = getContext();
            AppOpsManager appOps = (AppOpsManager) context.getSystemService(Context.APP_OPS_SERVICE);
            int mode = appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.getPackageName()
            );
            boolean isGranted = (mode == AppOpsManager.MODE_ALLOWED);
            JSObject result = new JSObject();
            result.put("granted", isGranted);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Error checking usage stats permission: " + e.getMessage());
        }
    }

    @PluginMethod
    public void requestUsagePermission(PluginCall call) {
        try {
            Context context = getContext();
            Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Unable to open usage access settings: " + e.getMessage());
        }
    }

    @PluginMethod
    public void queryDailyUsage(PluginCall call) {
        try {
            Context context = getContext();
            AppOpsManager appOps = (AppOpsManager) context.getSystemService(Context.APP_OPS_SERVICE);
            int mode = appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.getPackageName()
            );

            if (mode != AppOpsManager.MODE_ALLOWED) {
                call.reject("PERMISSION_DENIED", "Usage access permission not granted by user.");
                return;
            }

            Calendar calendar = Calendar.getInstance();
            calendar.set(Calendar.HOUR_OF_DAY, 0);
            calendar.set(Calendar.MINUTE, 0);
            calendar.set(Calendar.SECOND, 0);
            calendar.set(Calendar.MILLISECOND, 0);
            long startTime = calendar.getTimeInMillis();
            long endTime = System.currentTimeMillis();

            UsageStatsManager usageStatsManager = (UsageStatsManager) context.getSystemService(Context.USAGE_STATS_SERVICE);
            Map<String, UsageStats> aggregateStats = usageStatsManager.queryAndAggregateUsageStats(startTime, endTime);

            long totalForegroundMillis = 0;
            long productiveMillis = 0;
            long communicationMillis = 0;
            long entertainmentMillis = 0;
            long utilityMillis = 0;

            JSArray topAppsArray = new JSArray();

            if (aggregateStats != null) {
                for (Map.Entry<String, UsageStats> entry : aggregateStats.entrySet()) {
                    UsageStats stats = entry.getValue();
                    long timeInFg = stats.getTotalTimeInForeground();
                    if (timeInFg > 60000) { // More than 1 minute
                        totalForegroundMillis += timeInFg;
                        String pkg = entry.getKey().toLowerCase();

                        // Categorize common app patterns
                        if (pkg.contains("slack") || pkg.contains("teams") || pkg.contains("mail") ||
                            pkg.contains("docs") || pkg.contains("notion") || pkg.contains("calendar") ||
                            pkg.contains("guideme") || pkg.contains("learn") || pkg.contains("code")) {
                            productiveMillis += timeInFg;
                        } else if (pkg.contains("whatsapp") || pkg.contains("telegram") || pkg.contains("messenger") ||
                                   pkg.contains("signal") || pkg.contains("sms") || pkg.contains("dialer")) {
                            communicationMillis += timeInFg;
                        } else if (pkg.contains("youtube") || pkg.contains("netflix") || pkg.contains("instagram") ||
                                   pkg.contains("tiktok") || pkg.contains("facebook") || pkg.contains("twitter") ||
                                   pkg.contains("reddit") || pkg.contains("game")) {
                            entertainmentMillis += timeInFg;
                        } else {
                            utilityMillis += timeInFg;
                        }

                        JSObject appInfo = new JSObject();
                        appInfo.put("package", entry.getKey());
                        appInfo.put("duration_minutes", (int) (timeInFg / 60000));
                        topAppsArray.put(appInfo);
                    }
                }
            }

            int totalMinutes = (int) (totalForegroundMillis / 60000);
            int focusMinutes = (int) (productiveMillis / 60000);

            JSObject categories = new JSObject();
            categories.put("productive", (int) (productiveMillis / 60000));
            categories.put("communication", (int) (communicationMillis / 60000));
            categories.put("entertainment_distraction", (int) (entertainmentMillis / 60000));
            categories.put("utility", (int) (utilityMillis / 60000));

            JSObject result = new JSObject();
            result.put("total_screen_time_minutes", totalMinutes);
            result.put("focus_time_minutes", focusMinutes);
            result.put("categories", categories);
            result.put("top_apps", topAppsArray);
            result.put("provider_mode", "connected");
            result.put("source", "android_usage_stats");

            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to query usage stats: " + e.getMessage());
        }
    }
}
