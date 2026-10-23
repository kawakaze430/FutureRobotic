-- Read-only: each row is an incident requiring review, never an automatic credit.
SELECT 'reservation_state' AS check_name,r.run_id::text AS id
FROM reservations r JOIN tool_runs t ON t.id=r.run_id
WHERE (r.status='held' AND t.status IN('completed','failed','cancelled'))
   OR (r.status='released' AND t.status='completed');
SELECT 'spend_day_negative' AS check_name,day::text AS id FROM spend_days
WHERE held_micro_usd<0 OR spent_micro_usd<0;
SELECT 'spend_hold_mismatch' AS check_name,d.day::text AS id
FROM spend_days d LEFT JOIN (SELECT day,sum(micro_usd) AS n FROM spend_holds WHERE status='held' GROUP BY day) h ON h.day=d.day
WHERE d.held_micro_usd<>coalesce(h.n,0);
SELECT 'stale_checkout' AS check_name,id::text AS id FROM checkout_intents
WHERE state IN('creating','uncertain') AND created_at<now()-interval '15 minutes';
SELECT 'unknown_dispatch' AS check_name,id::text AS id FROM tool_runs
WHERE status='uncertain';
SELECT 'queue_dead' AS check_name,id::text AS id FROM jobs WHERE status='dead';
