-- Fix empty assigned_to fields in tasks table
-- Set empty assigned_to to the CEO user ID
UPDATE tasks
SET assigned_to = 'ceo-001'
WHERE assigned_to = ''
    OR assigned_to IS NULL;
-- Verify the update
SELECT id,
    title,
    assigned_to,
    assigned_by,
    status
FROM tasks;