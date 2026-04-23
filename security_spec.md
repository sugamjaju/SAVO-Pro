# Security Specification - SAVO Pro

## Data Invariants
1. A **User** must belong to exactly one **Organization**.
2. A **Project** must belong to an **Organization**.
3. A **Task** must belong to a **Project** and an **Organization**.
4. Visibility Rule (Task): A user can see a task IF:
   - They are the assignee.
   - They created the task.
   - They are the owner or a member of the parent project.
   - They are an Admin in the organization.
5. Visibility Rule (Project): A user can see a project IF:
   - They are the owner.
   - They are a member of the project members array.
   - They are an Admin in the organization.

## The "Dirty Dozen" Payloads (Attacker Scenarios)

1. **Identity Spoofing**: User A tries to update User B's `orgId` to hijack their workspace. 
   - *Target*: `update /users/userB { orgId: 'attackerOrg' }`
   - *Result*: `PERMISSION_DENIED`

2. **Privilege Escalation**: User A (member) tries to set `role: 'admin'` on their own profile during create or update.
   - *Target*: `create /users/userA { role: 'admin', ... }`
   - *Result*: `PERMISSION_DENIED` (only 'member' allowed on self-register, or role must be immutable/system-set)

3. **Orphaned Writes (Task)**: Creating a task with a `projectId` that doesn't exist or belongs to another org.
   - *Target*: `create /tasks/task1 { projectId: 'missingProject', ... }`
   - *Result*: `PERMISSION_DENIED` (rules must verify existence of project and membership)

4. **Resource Poisoning**: Injecting a 2MB string into a `description` field.
   - *Target*: `update /tasks/task1 { description: 'A'.repeat(2000000) }`
   - *Result*: `PERMISSION_DENIED` (rules size check)

5. **Cross-Org Scraping**: User from Org A tries to list all projects from Org B by using Org B's ID in a query.
   - *Target*: `query /projects where orgId == 'orgB'`
   - *Result*: `PERMISSION_DENIED`

6. **State Stealing**: User A (not a member of Project P) tries to `get` Task T which belongs to Project P.
   - *Target*: `get /tasks/taskT`
   - *Result*: `PERMISSION_DENIED`

7. **Comment Injection**: Posting a comment on a task the user doesn't have access to.
   - *Target*: `create /tasks/taskT/comments/msg1 { ... }`
   - *Result*: `PERMISSION_DENIED`

8. **Admin Lockdown**: Trying to delete the organization owner's profile.
   - *Target*: `delete /users/ownerId`
   - *Result*: `PERMISSION_DENIED`

9. **Invisible Project Peek**: Accessing a project's `members` list when not involved.
   - *Target*: `get /projects/projectP`
   - *Result*: `PERMISSION_DENIED`

10. **Shadow Assignment**: Assigning a task to a user who is not part of the organization.
    - *Target*: `create /tasks/task1 { assignedTo: 'outsideUser', ... }`
    - *Result*: `PERMISSION_DENIED` (verify assignee is in org)

11. **Timestamp Forgery**: Proving an old task was just created.
    - *Target*: `create /tasks/task1 { createdAt: timestamp_past }`
    - *Result*: `PERMISSION_DENIED` (must be `request.time`)

12. **Outcome Flipping**: Changing the `status` of a task that is already marked as `completed`.
    - *Target*: `update /tasks/task1 { status: 'pending' }` when `existing().status == 'completed'`
    - *Result*: `PERMISSION_DENIED` (terminal state lock)
