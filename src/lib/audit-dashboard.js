import { permissionAuditService } from '@/services';
import { getConfigEngine } from '@/lib/config-generator-engine';

export class AuditDashboard {
  async getRecentActivity(days, limit) {
    const config = await getConfigEngine();
    const auditCfg = config.getConfig().thresholds.audit;

    days = days || auditCfg.recent_activity_days;
    limit = limit || auditCfg.default_limit;
    const nowTimestamp = Math.floor(Date.now() / 1000);
    const startTimestamp = nowTimestamp - (days * 24 * 60 * 60);

    const changes = await permissionAuditService.getChangesByDateRange(
      startTimestamp,
      nowTimestamp,
      limit
    );

    return {
      period: `Last ${days} days`,
      total_changes: changes.length,
      changes,
    };
  }

  async getUserActivity(userId, limit) {
    const config = await getConfigEngine();
    const auditCfg = config.getConfig().thresholds.audit;

    limit = limit || auditCfg.user_activity_limit;
    const changes = await permissionAuditService.getAuditTrail({
      userId,
      limit,
    });

    const breakdown = this.categorizeChanges(changes);

    return {
      user_id: userId,
      total_changes: changes.length,
      breakdown,
      recent_changes: changes.slice(0, auditCfg.recent_changes_display),
    };
  }

  async getEntityHistory(entityType, entityId, limit) {
    const config = await getConfigEngine();
    const auditCfg = config.getConfig().thresholds.audit;

    limit = limit || auditCfg.default_limit;
    const changes = await permissionAuditService.getAuditTrail({
      entityType,
      entityId,
      limit,
    });

    const timeline = changes.map(change => ({
      timestamp: change.timestamp,
      timestamp_iso: new Date(change.timestamp * 1000).toISOString(),
      action: change.action,
      user_id: change.user_id,
      reason: change.reason,
      reason_code: change.reason_code,
      diff: change.old_permissions && change.new_permissions
        ? permissionAuditService.getPermissionDiff(
            change.old_permissions,
            change.new_permissions
          )
        : null,
    }));

    return {
      entity_type: entityType,
      entity_id: entityId,
      total_changes: changes.length,
      timeline,
    };
  }

  async getAffectedUserChanges(userId, limit) {
    const config = await getConfigEngine();
    const auditCfg = config.getConfig().thresholds.audit;

    limit = limit || auditCfg.user_activity_limit;
    const changes = await permissionAuditService.getAuditTrail({
      affectedUserId: userId,
      limit,
    });

    return {
      affected_user_id: userId,
      total_changes: changes.length,
      changes: changes.map(c => ({
        id: c.id,
        timestamp: c.timestamp,
        changed_by: c.user_id,
        entity_type: c.entity_type,
        entity_id: c.entity_id,
        action: c.action,
        reason: c.reason,
        reason_code: c.reason_code,
      })),
    };
  }

  async getActionSummary() {
    const actionBreakdown = await permissionAuditService.getActionBreakdown();
    const reasonBreakdown = await permissionAuditService.getReasonCodeBreakdown();
    const stats = await permissionAuditService.getAuditStats();

    return {
      total_audits: stats.total_audits,
      unique_users: stats.unique_users,
      entity_types_affected: stats.entity_types,
      earliest_change: stats.earliest_change
        ? new Date(stats.earliest_change * 1000).toISOString()
        : null,
      latest_change: stats.latest_change
        ? new Date(stats.latest_change * 1000).toISOString()
        : null,
      by_action: this.formatBreakdown(actionBreakdown),
      by_reason: this.formatBreakdown(reasonBreakdown),
    };
  }

  async getCollaboratorChanges(reviewId, limit) {
    const config = await getConfigEngine();
    const auditCfg = config.getConfig().thresholds.audit;

    limit = limit || auditCfg.default_limit;
    const changes = await permissionAuditService.getAuditTrail({
      entityType: 'review',
      entityId: reviewId,
      limit,
    });

    const collaboratorChanges = changes.filter(c =>
      c.reason_code === 'collaborator_added' ||
      c.reason_code === 'collaborator_removed'
    );

    const added = collaboratorChanges.filter(c => c.reason_code === 'collaborator_added');
    const removed = collaboratorChanges.filter(c => c.reason_code === 'collaborator_removed');

    return {
      review_id: reviewId,
      total_collaborator_changes: collaboratorChanges.length,
      added: added.length,
      removed: removed.length,
      changes: collaboratorChanges,
    };
  }

  async getRoleChangeHistory(limit) {
    const config = await getConfigEngine();
    const auditCfg = config.getConfig().thresholds.audit;

    limit = limit || auditCfg.default_limit;
    const changes = await permissionAuditService.getChangesByAction('role_change', limit);

    const byUser = {};
    changes.forEach(change => {
      if (!byUser[change.affected_user_id]) {
        byUser[change.affected_user_id] = [];
      }
      byUser[change.affected_user_id].push({
        timestamp: change.timestamp,
        from: change.old_permissions?.role,
        to: change.new_permissions?.role,
        changed_by: change.user_id,
        reason: change.reason,
      });
    });

    return {
      total_role_changes: changes.length,
      affected_users: Object.keys(byUser).length,
      by_user: byUser,
      recent_changes: changes.slice(0, 20),
    };
  }

  async getLifecycleTransitionAudits(entityType, limit) {
    const config = await getConfigEngine();
    const auditCfg = config.getConfig().thresholds.audit;

    limit = limit || auditCfg.default_limit;
    const changes = await permissionAuditService.getChangesByReasonCode(
      'lifecycle_transition',
      limit
    );

    const filtered = changes.filter(c => c.entity_type === entityType);

    const byStage = {};
    filtered.forEach(change => {
      const from = change.old_permissions?.stage || 'unknown';
      const to = change.new_permissions?.stage || 'unknown';
      const key = `${from} → ${to}`;

      if (!byStage[key]) {
        byStage[key] = 0;
      }
      byStage[key]++;
    });

    return {
      entity_type: entityType,
      total_transitions: filtered.length,
      by_transition: byStage,
      recent: filtered.slice(0, 10),
    };
  }

  async searchAudits(searchTerm, limit) {
    const config = await getConfigEngine();
    const auditCfg = config.getConfig().thresholds.audit;

    limit = limit || auditCfg.default_limit;
    const results = await permissionAuditService.searchAuditTrail(searchTerm, limit);

    return {
      search_term: searchTerm,
      results_count: results.length,
      results: results.map(r => ({
        id: r.id,
        timestamp: r.timestamp,
        timestamp_iso: new Date(r.timestamp * 1000).toISOString(),
        user_id: r.user_id,
        entity_type: r.entity_type,
        entity_id: r.entity_id,
        action: r.action,
        reason: r.reason,
        reason_code: r.reason_code,
      })),
    };
  }

  async getComplianceReport(startDate, endDate) {
    const config = await getConfigEngine();
    const auditCfg = config.getConfig().thresholds.audit;

    const changes = await permissionAuditService.getChangesByDateRange(
      startDate,
      endDate,
      auditCfg.export_max_limit
    );

    const critical = changes.filter(c =>
      c.action === 'role_change' ||
      c.reason_code === 'admin_action'
    );

    const byDay = {};
    changes.forEach(change => {
      const date = new Date(change.timestamp * 1000).toISOString().split('T')[0];
      if (!byDay[date]) {
        byDay[date] = 0;
      }
      byDay[date]++;
    });

    return {
      period: {
        start: new Date(startDate * 1000).toISOString(),
        end: new Date(endDate * 1000).toISOString(),
      },
      total_changes: changes.length,
      critical_changes: critical.length,
      changes_by_day: byDay,
      critical_changes_list: critical.slice(0, 50),
    };
  }

  async getAnomalousActivity(threshold) {
    const config = await getConfigEngine();
    const auditCfg = config.getConfig().thresholds.audit;

    threshold = threshold || auditCfg.anomalous_activity_threshold;
    const recent = await permissionAuditService.getRecentChanges(1000);

    const byUser = {};
    recent.forEach(change => {
      if (!byUser[change.user_id]) {
        byUser[change.user_id] = [];
      }
      byUser[change.user_id].push(change);
    });

    const anomalous = Object.entries(byUser)
      .filter(([_, changes]) => changes.length >= threshold)
      .map(([userId, changes]) => ({
        user_id: userId,
        change_count: changes.length,
        actions: this.categorizeChanges(changes),
        first_change: changes[changes.length - 1].timestamp,
        last_change: changes[0].timestamp,
      }));

    return {
      threshold,
      anomalous_users: anomalous.length,
      users: anomalous,
    };
  }

  categorizeChanges(changes) {
    const categories = {
      grant: 0,
      revoke: 0,
      modify: 0,
      role_change: 0,
      template_applied: 0,
    };

    changes.forEach(change => {
      if (categories[change.action] !== undefined) {
        categories[change.action]++;
      }
    });

    return categories;
  }

  formatBreakdown(breakdown) {
    return breakdown.reduce((acc, item) => {
      acc[item.action || item.reason_code] = item.count;
      return acc;
    }, {});
  }

  async generateSummaryReport(days) {
    const config = await getConfigEngine();
    const auditCfg = config.getConfig().thresholds.audit;

    days = days || auditCfg.summary_report_days;
    const nowTimestamp = Math.floor(Date.now() / 1000);
    const startTimestamp = nowTimestamp - (days * 24 * 60 * 60);

    const [
      recentActivity,
      actionSummary,
      roleChanges,
      anomalous,
    ] = await Promise.all([
      this.getRecentActivity(days),
      this.getActionSummary(),
      this.getRoleChangeHistory(1000),
      this.getAnomalousActivity(5),
    ]);

    return {
      report_date: new Date().toISOString(),
      period_days: days,
      summary: {
        total_changes: recentActivity.total_changes,
        total_audits_all_time: actionSummary.total_audits,
        unique_users: actionSummary.unique_users,
        entity_types: actionSummary.entity_types_affected,
      },
      activity: recentActivity,
      breakdown: actionSummary,
      role_changes: {
        total: roleChanges.total_role_changes,
        affected_users: roleChanges.affected_users,
        recent: roleChanges.recent_changes,
      },
      anomalous_activity: anomalous,
    };
  }
}

export const auditDashboard = new AuditDashboard();
