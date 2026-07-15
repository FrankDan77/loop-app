import json, math, os

BASE = "/Users/wushengyu/Develop/hustle/superset/apps/desktop"
dispatch = json.load(open(os.path.join(BASE, ".ua/tmp/dispatch-1.json")))
IMPORTS = dispatch["batchImportData"]

# FILES: path -> (type, complexity, summary, tags)
FILES = {}
def F(path, typ, cx, summary, tags):
    FILES[path] = {"type": typ, "cx": cx, "summary": summary, "tags": tags}

# FNS: list of dicts {path,name,start,end,exported,type,summary,tags}
FNS = []
def N(path, name, s, e, exp, summary, tags, typ="function"):
    FNS.append({"path": path, "name": name, "s": s, "e": e, "exp": exp,
                "type": typ, "summary": summary, "tags": tags})

CALLS = []  # (srcId, tgtId)
def C(src, tgt):
    CALLS.append((src, tgt))

TESTED = []  # (prodPath, testPath)

# --- patch-dev-protocol.ts
P="scripts/patch-dev-protocol.ts"
N(P,"getWorktreeSegmentsFromCwd",52,64,True,"Derives the worktree path segments relative to the worktree base from the current working directory.",["worktree","path","cwd","util"])
N(P,"deriveWorktreePathFromSegments",73,87,True,"Reconstructs the absolute worktree path from parsed worktree segments.",["worktree","path","derive","util"])
N(P,"getWorkspaceDisplayNameFromProdDb",89,124,True,"Looks up a workspace's display name from the production SQLite DB by worktree path.",["workspace","database","lookup","sqlite"])
N(P,"resolveWorkspaceIdentity",126,165,True,"Resolves the workspace name and worktree path used to derive per-workspace protocol identity.",["workspace","identity","worktree","resolve"])
N(P,"main",167,370,True,"Entry point that reads the app plist and rewrites the bundle id / protocol scheme symlinks for the current worktree.",["script","electron","protocol","plist","entrypoint"])

# --- setup.ts
N("src/lib/electron-app/factories/app/setup.ts","makeAppSetup",10,61,True,"Factory that wires Electron app-ready/activate/web-contents events to create windows and open external links.",["electron","app-lifecycle","factory","window"])

# --- create.ts
N("src/lib/electron-app/factories/windows/create.ts","createWindow",6,27,True,"Creates a BrowserWindow, registers its route, and forwards external links to the OS browser.",["electron","browser-window","factory","routing"])

# --- ignore-console-warnings.ts
N("src/lib/electron-app/utils/ignore-console-warnings.ts","ignoreConsoleWarnings",1,17,True,"Overrides process.emitWarning to swallow warnings matching a provided list.",["electron","warnings","console","util"])

# --- analytics
N("src/lib/trpc/routers/analytics/index.ts","createAnalyticsRouter",5,13,True,"Builds the tRPC analytics router with an identify mutation that sets the PostHog user id.",["trpc","analytics","posthog","factory"])

# --- auth/index.ts
N("src/lib/trpc/routers/auth/index.ts","createAuthRouter",21,118,True,"Builds the tRPC auth router exposing token, host-identity, OAuth deep-link, subscription, and logout procedures.",["trpc","auth","oauth","factory","router"])

# --- auth-functions.ts
AF="src/lib/trpc/routers/auth/utils/auth-functions.ts"
N(AF,"loadToken",29,40,True,"Reads and decrypts the persisted auth token from disk, returning null when absent.",["auth","token","decrypt","load"])
N(AF,"saveToken",45,55,True,"Encrypts and writes the auth token to disk and emits a saved event.",["auth","token","encrypt","persist"])
N(AF,"handleAuthCallback",61,74,True,"Validates the OAuth state and saves the token returned by the auth callback.",["auth","oauth","callback","token"])
N(AF,"parseAuthDeepLink",79,95,True,"Parses an auth deep-link URL into token/state parameters.",["auth","deep-link","parse","oauth"])

# --- crypto-storage.ts
CS="src/lib/trpc/routers/auth/utils/crypto-storage.ts"
N(CS,"encrypt",23,37,True,"Encrypts plaintext with AES-256-GCM using a machine-derived key, returning salt+iv+tag+ciphertext.",["crypto","encrypt","aes-gcm","security"])
N(CS,"decrypt",44,66,True,"Decrypts AES-256-GCM data produced by encrypt, verifying the auth tag.",["crypto","decrypt","aes-gcm","security"])

# --- auto-update
N("src/lib/trpc/routers/auto-update/index.ts","createAutoUpdateRouter",16,66,True,"Builds the tRPC auto-update router with a status subscription and update lifecycle mutations.",["trpc","auto-update","factory","router"])

# --- browser-history
N("src/lib/trpc/routers/browser-history/index.ts","createBrowserHistoryRouter",7,70,True,"Builds the tRPC browser-history router for querying, searching, recording, and clearing history.",["trpc","browser-history","local-db","factory"])

# --- browser
N("src/lib/trpc/routers/browser/browser.ts","createBrowserRouter",7,209,True,"Builds the tRPC browser router exposing navigation, reload, screenshot, JS eval, event subscriptions, and storage clearing.",["trpc","browser","webcontents","factory","router"])

# --- cache
N("src/lib/trpc/routers/cache/index.ts","createCacheRouter",5,31,True,"Builds the tRPC cache router that clears the Electron default session data.",["trpc","cache","session","factory"])

# --- branches.ts
BR="src/lib/trpc/routers/changes/branches.ts"
N(BR,"createBranchesRouter",21,163,True,"Builds the tRPC branches router listing branches, base config, and checkout state per worktree.",["trpc","git","branches","factory","router"])
N(BR,"getLocalBranchesWithDates",165,194,False,"Collects local branches with their last-commit dates for sorting/display.",["git","branches","dates","util"])
N(BR,"getDefaultBranch",196,212,False,"Determines the repository's default branch from the remote branch list.",["git","branches","default","util"])
N(BR,"getCheckedOutBranches",214,238,False,"Lists branches currently checked out across worktrees to prevent conflicting checkouts.",["git","branches","worktree","checkout"])

# --- file-contents.ts
FC="src/lib/trpc/routers/changes/file-contents.ts"
N(FC,"createFileContentsRouter",11,80,True,"Builds the tRPC router returning file versions (working/committed/staged/base) for diffs.",["trpc","git","diff","file-contents","factory"])
N(FC,"getGitOnlyVersions",87,108,False,"Resolves committed and staged versions of a file without touching the working tree.",["git","diff","versions","util"])
N(FC,"safeGitShow",110,129,False,"Runs git show for a ref:path, returning null on missing-object errors instead of throwing.",["git","show","safe","util"])
N(FC,"getAgainstBaseVersions",131,143,False,"Resolves file versions comparing the working tree against the base branch.",["git","diff","base-branch","util"])
N(FC,"getCommittedVersions",145,157,False,"Resolves committed file versions for diff display.",["git","diff","committed","util"])
N(FC,"getStagedVersions",159,170,False,"Resolves staged (index) file versions for diff display.",["git","diff","staged","util"])

# --- git-operations.ts
GO="src/lib/trpc/routers/changes/git-operations.ts"
N(GO,"getLocalBranchOrThrow",33,48,False,"Resolves the current local branch for a worktree or throws a descriptive error.",["git","branch","validation","util"])
N(GO,"createGitOperationsRouter",50,341,True,"Builds the tRPC git-operations router (commit, push, PR create/merge, discard).",["trpc","git","commit","push","factory"])
N(GO,"isUpstreamMissingError",29,31,True,"Re-exported predicate detecting a missing-upstream git error.",["git","errors","predicate","util"],)

# --- git-utils.ts
GU="src/lib/trpc/routers/changes/git-utils.ts"
N(GU,"isUpstreamMissingError",4,11,True,"Predicate matching git errors indicating the branch has no upstream configured.",["git","errors","upstream","predicate"])
N(GU,"isNoPullRequestFoundMessage",13,15,True,"Predicate matching GitHub CLI output meaning no PR was found for the branch.",["git","pull-request","errors","predicate"])

# --- changes/index.ts
N("src/lib/trpc/routers/changes/index.ts","createChangesRouter",8,31,True,"Composes the changes tRPC router from branches, file-contents, git-operations, staging, and status sub-routers.",["trpc","changes","composition","factory"])

# --- git-commands.ts
GC="src/lib/trpc/routers/changes/security/git-commands.ts"
N(GC,"isCurrentBranch",25,38,False,"Checks whether a given branch is the currently checked-out branch of a worktree.",["git","branch","check","util"])
N(GC,"gitSwitchBranch",48,88,True,"Safely switches a worktree to a branch, tolerating post-checkout hook failures.",["git","switch","branch","security"])
N(GC,"gitCheckoutFiles",98,112,True,"Checks out (restores) specific validated file paths in a worktree.",["git","checkout","files","security"])
N(GC,"gitStageFile",120,129,True,"Stages a single validated file path.",["git","stage","file","security"])
N(GC,"gitStageFiles",137,151,True,"Stages multiple validated file paths.",["git","stage","files","security"])
N(GC,"gitUnstageFiles",159,173,True,"Unstages multiple validated file paths.",["git","unstage","files","security"])
N(GC,"gitStageAll",180,185,True,"Stages all changes in a worktree.",["git","stage","all","security"])
N(GC,"gitUnstageFile",193,202,True,"Unstages a single validated file path.",["git","unstage","file","security"])
N(GC,"gitUnstageAll",210,215,True,"Unstages all staged changes in a worktree.",["git","unstage","all","security"])
N(GC,"gitDiscardAllUnstaged",223,230,True,"Discards all unstaged working-tree changes.",["git","discard","unstaged","security"])
N(GC,"gitDiscardAllStaged",238,244,True,"Discards all staged changes back to the index baseline.",["git","discard","staged","security"])
N(GC,"gitStash",251,256,True,"Stashes tracked changes in a worktree.",["git","stash","security"])
N(GC,"gitStashIncludeUntracked",263,270,True,"Stashes changes including untracked files.",["git","stash","untracked","security"])
N(GC,"gitStashPop",278,283,True,"Pops the most recent stash in a worktree.",["git","stash","pop","security"])

# --- path-validation.ts
PV="src/lib/trpc/routers/changes/security/path-validation.ts"
N(PV,"PathValidationError",49,57,True,"Error type raised when a path fails worktree-registration or traversal validation.",["security","error","path-validation","class"],typ="class")
N(PV,"assertRegisteredWorktree",69,96,True,"Asserts a worktree path is registered in the local DB, throwing PathValidationError otherwise.",["security","worktree","validation","assert"])
N(PV,"getRegisteredWorktree",104,121,True,"Looks up and returns a registered worktree record for a path.",["security","worktree","lookup","db"])
N(PV,"validateRelativePath",140,172,True,"Validates a relative path stays within its worktree, rejecting traversal and absolute paths.",["security","path-validation","traversal","relative"])
N(PV,"resolvePathInWorktree",183,191,True,"Resolves a validated relative path to an absolute path within a worktree.",["security","path","resolve","worktree"])
N(PV,"assertValidGitPath",198,200,True,"Asserts a git pathspec is safe to pass to git commands.",["security","git","path","assert"])

# --- staging.ts
ST="src/lib/trpc/routers/changes/staging.ts"
N(ST,"deleteFiles",40,53,False,"Deletes untracked/staged-new files from disk after path validation.",["git","staging","delete","files"])
N(ST,"createStagingRouter",55,214,True,"Builds the tRPC staging router for staging, unstaging, discarding, and deleting files.",["trpc","git","staging","factory","router"])

# --- status.ts
N("src/lib/trpc/routers/changes/status.ts","createStatusRouter",16,116,True,"Builds the tRPC status router returning cached or worker-computed git working-tree status.",["trpc","git","status","cache","factory"])

# --- existing-pr-push-target.ts
EP="src/lib/trpc/routers/changes/utils/existing-pr-push-target.ts"
N(EP,"isOpenPullRequestState",22,26,True,"Predicate identifying whether a PR state string represents an open PR.",["git","pull-request","state","predicate"])
N(EP,"getExistingPRHeadRepoUrl",28,43,True,"Extracts the head repository URL of an existing open pull request.",["git","pull-request","repo-url","util"])
N(EP,"resolveRemoteNameForExistingPRHead",45,87,True,"Resolves which git remote corresponds to an existing PR's head repo.",["git","remote","pull-request","resolve"])
N(EP,"shouldRetargetPushToExistingPRHead",89,104,True,"Decides whether a push should be retargeted to an existing PR's head branch/remote.",["git","push","pull-request","decision"])

# --- git-push.ts
GP="src/lib/trpc/routers/changes/utils/git-push.ts"
N(GP,"getTrackingRef",23,34,False,"Reads the configured upstream tracking ref for the current branch.",["git","tracking","upstream","util"])
N(GP,"hasUpstreamBranch",36,51,True,"Checks whether the current branch has an upstream branch configured.",["git","upstream","branch","check"])
N(GP,"fetchCurrentBranch",58,93,True,"Fetches the current branch from its tracking remote.",["git","fetch","branch","remote"])
N(GP,"pushWithSetUpstream",95,122,False,"Pushes the current branch and sets its upstream tracking ref.",["git","push","upstream","util"])
N(GP,"resolveExistingPullRequestPushTarget",132,172,False,"Resolves the remote/branch to push to when an existing open PR should be targeted.",["git","push","pull-request","resolve"])
N(GP,"resolveMismatchedPullRequestPushTarget",174,201,False,"Resolves a push target when the local upstream mismatches the PR head.",["git","push","pull-request","resolve"])
N(GP,"pushWithResolvedUpstream",203,233,True,"Pushes using a fully resolved upstream target, retrying with set-upstream when needed.",["git","push","upstream","retry"])
N(GP,"pushCurrentBranch",248,287,True,"Pushes the current branch, resolving PR-aware upstream targets and handling missing upstream.",["git","push","branch","pull-request"])
N(GP,"isNonFastForwardPushError",289,299,True,"Predicate detecting a non-fast-forward rejection from a git push.",["git","push","errors","predicate"])
N(GP,"getTrackingBranchStatus",301,337,True,"Computes ahead/behind tracking status of the current branch against its upstream.",["git","tracking","status","ahead-behind"])

# --- merge-pull-request.ts
N("src/lib/trpc/routers/changes/utils/merge-pull-request.ts","mergePullRequest",23,97,True,"Merges a pull request through the GitHub CLI and clears related worktree caches.",["git","pull-request","merge","github"])

# --- pull-request-discovery.ts
PD="src/lib/trpc/routers/changes/utils/pull-request-discovery.ts"
N(PD,"findOpenPRByHeadCommit",14,61,False,"Finds an open pull request matching the current head commit.",["git","pull-request","discovery","commit"])
N(PD,"findExistingOpenPRUrl",63,99,True,"Finds the URL of an existing open pull request for the current branch/commit.",["git","pull-request","discovery","url"])
N(PD,"getMergeBaseBranch",114,128,False,"Determines the merge-base branch used when building a compare URL.",["git","merge-base","branch","util"])
N(PD,"buildNewPullRequestUrl",130,187,True,"Builds a GitHub compare URL for opening a new pull request.",["git","pull-request","url","github"])

# --- pull-request-url.ts
PU="src/lib/trpc/routers/changes/utils/pull-request-url.ts"
N(PU,"normalizeGitHubRepoUrl",13,28,True,"Normalizes assorted GitHub repo URL/remote forms into a canonical https URL.",["git","github","url","normalize"])
N(PU,"buildPullRequestCompareUrl",30,41,True,"Builds a GitHub PR compare URL from a parsed upstream ref.",["git","pull-request","url","github"])

# --- status-cache.ts
SC="src/lib/trpc/routers/changes/utils/status-cache.ts"
N(SC,"makeStatusCacheKey",13,18,True,"Builds the cache key for a git status result from worktree and options.",["git","status","cache","key"])
N(SC,"getCachedStatus",20,28,True,"Returns a cached git status if present and unexpired.",["git","status","cache","read"])
N(SC,"setCachedStatus",30,35,True,"Stores a git status result in the TTL cache.",["git","status","cache","write"])
N(SC,"getInFlightStatus",37,41,True,"Returns an in-flight status promise for dedup, if one exists.",["git","status","cache","dedup"])
N(SC,"setInFlightStatus",43,48,True,"Registers an in-flight status promise for dedup.",["git","status","cache","dedup"])
N(SC,"clearStatusCacheForWorktree",54,68,True,"Invalidates cached and in-flight status entries for a worktree.",["git","status","cache","invalidate"])

# --- worktree-status-caches.ts
N("src/lib/trpc/routers/changes/utils/worktree-status-caches.ts","clearWorktreeStatusCaches",4,7,True,"Clears both git status and GitHub caches for a worktree.",["git","cache","worktree","invalidate"])

# --- chat-runtime-service
CR="src/lib/trpc/routers/chat-runtime-service/index.ts"
N(CR,"resolveNotificationIdsFromSession",9,38,False,"Resolves notification pane/session ids from a chat runtime session for event routing.",["chat","notifications","session","resolve"])
N(CR,"createChatRuntimeServiceRouter",59,59,True,"Factory constructing the chat runtime service tRPC router.",["trpc","chat","runtime","factory"])

# --- config.ts
CF="src/lib/trpc/routers/config/config.ts"
N(CF,"hasConfiguredScripts",12,35,False,"Checks whether the Superset config declares any runnable setup scripts.",["config","scripts","check","util"])
N(CF,"detectSetupDefaults",53,339,False,"Inspects a repository to infer sensible default setup/config values (package manager, scripts, ports).",["config","setup","detection","heuristics"])
N(CF,"ensureConfigExists",345,359,False,"Creates the Superset config file from a template when it does not yet exist.",["config","file","template","setup"])
N(CF,"createConfigRouter",361,504,True,"Builds the tRPC config router exposing setup detection, config read, and config write procedures.",["trpc","config","factory","router"])

def fid(path,name): return "function:%s:%s" % (path,name)
def cid(path,name): return "class:%s:%s" % (path,name)

# Within-batch calls (confident)
C(fid(P,"resolveWorkspaceIdentity"), fid(P,"getWorktreeSegmentsFromCwd"))
C(fid(P,"resolveWorkspaceIdentity"), fid(P,"deriveWorktreePathFromSegments"))
C(fid(P,"main"), fid(P,"resolveWorkspaceIdentity"))
C(fid(AF,"loadToken"), fid(CS,"decrypt"))
C(fid(AF,"saveToken"), fid(CS,"encrypt"))
C(fid(AF,"handleAuthCallback"), fid(AF,"saveToken"))
C(fid("src/lib/trpc/routers/auth/index.ts","createAuthRouter"), fid(AF,"loadToken"))
C(fid("src/lib/trpc/routers/auth/index.ts","createAuthRouter"), fid(AF,"saveToken"))
C(fid(BR,"createBranchesRouter"), fid(BR,"getLocalBranchesWithDates"))
C(fid(BR,"createBranchesRouter"), fid(BR,"getDefaultBranch"))
C(fid(BR,"createBranchesRouter"), fid(BR,"getCheckedOutBranches"))
C(fid(BR,"createBranchesRouter"), fid(PV,"assertRegisteredWorktree"))
C(fid(FC,"createFileContentsRouter"), fid(FC,"getGitOnlyVersions"))
C(fid(FC,"getGitOnlyVersions"), fid(FC,"getCommittedVersions"))
C(fid(FC,"getGitOnlyVersions"), fid(FC,"getStagedVersions"))
C(fid(FC,"getCommittedVersions"), fid(FC,"safeGitShow"))
C(fid(FC,"getStagedVersions"), fid(FC,"safeGitShow"))
C(fid(FC,"getAgainstBaseVersions"), fid(FC,"safeGitShow"))
C(fid(GO,"createGitOperationsRouter"), fid(GO,"getLocalBranchOrThrow"))
C(fid(GO,"createGitOperationsRouter"), fid(GP,"pushCurrentBranch"))
C(fid(GO,"createGitOperationsRouter"), fid("src/lib/trpc/routers/changes/utils/merge-pull-request.ts","mergePullRequest"))
C(fid(GO,"createGitOperationsRouter"), fid(PD,"findExistingOpenPRUrl"))
C(fid(GO,"createGitOperationsRouter"), fid(PD,"buildNewPullRequestUrl"))
C(fid("src/lib/trpc/routers/changes/index.ts","createChangesRouter"), fid(BR,"createBranchesRouter"))
C(fid("src/lib/trpc/routers/changes/index.ts","createChangesRouter"), fid(FC,"createFileContentsRouter"))
C(fid("src/lib/trpc/routers/changes/index.ts","createChangesRouter"), fid(GO,"createGitOperationsRouter"))
C(fid("src/lib/trpc/routers/changes/index.ts","createChangesRouter"), fid(ST,"createStagingRouter"))
C(fid("src/lib/trpc/routers/changes/index.ts","createChangesRouter"), fid("src/lib/trpc/routers/changes/status.ts","createStatusRouter"))
C(fid(GC,"gitSwitchBranch"), fid(GC,"isCurrentBranch"))
C(fid(ST,"createStagingRouter"), fid(ST,"deleteFiles"))
C(fid(ST,"createStagingRouter"), fid(GC,"gitStageAll"))
C(fid(ST,"createStagingRouter"), fid(PV,"assertRegisteredWorktree"))
C(fid(ST,"createStagingRouter"), fid(SC,"clearStatusCacheForWorktree"))
C(fid("src/lib/trpc/routers/changes/status.ts","createStatusRouter"), fid(PV,"assertRegisteredWorktree"))
C(fid("src/lib/trpc/routers/changes/status.ts","createStatusRouter"), fid(SC,"getCachedStatus"))
C(fid("src/lib/trpc/routers/changes/status.ts","createStatusRouter"), fid(SC,"setCachedStatus"))
C(fid(GP,"pushCurrentBranch"), fid(GP,"pushWithResolvedUpstream"))
C(fid(GP,"pushCurrentBranch"), fid(GP,"resolveExistingPullRequestPushTarget"))
C(fid(GP,"pushCurrentBranch"), fid(GP,"hasUpstreamBranch"))
C(fid(GP,"pushCurrentBranch"), fid(EP,"shouldRetargetPushToExistingPRHead"))
C(fid(GP,"resolveExistingPullRequestPushTarget"), fid(EP,"getExistingPRHeadRepoUrl"))
C(fid(GP,"resolveExistingPullRequestPushTarget"), fid(EP,"resolveRemoteNameForExistingPRHead"))
C(fid(GP,"pushWithResolvedUpstream"), fid(GP,"pushWithSetUpstream"))
C(fid(GP,"getTrackingBranchStatus"), fid(GP,"getTrackingRef"))
C(fid(PD,"findExistingOpenPRUrl"), fid(PD,"findOpenPRByHeadCommit"))
C(fid(PD,"buildNewPullRequestUrl"), fid(PD,"getMergeBaseBranch"))
C(fid(PD,"buildNewPullRequestUrl"), fid(PU,"buildPullRequestCompareUrl"))
C(fid(PU,"buildPullRequestCompareUrl"), fid(PU,"normalizeGitHubRepoUrl"))
C(fid("src/lib/trpc/routers/changes/utils/worktree-status-caches.ts","clearWorktreeStatusCaches"), fid(SC,"clearStatusCacheForWorktree"))
C(fid(EP,"shouldRetargetPushToExistingPRHead"), fid(EP,"isOpenPullRequestState"))
C(fid(CF,"createConfigRouter"), fid(CF,"detectSetupDefaults"))
C(fid(CF,"createConfigRouter"), fid(CF,"ensureConfigExists"))
C(fid(CF,"detectSetupDefaults"), fid(CF,"hasConfiguredScripts"))
C(fid("src/lib/electron-app/factories/app/setup.ts","makeAppSetup"), fid("src/lib/electron-app/factories/windows/create.ts","createWindow"))

# Cross-batch calls to neighbor symbols
C(fid(P,"main"), "function:src/shared/worktree-id.ts:getWorkspaceName")

# tested_by (production -> test)
TESTED.append(("scripts/patch-dev-protocol.ts","scripts/patch-dev-protocol.test.ts"))
TESTED.append((GU,"src/lib/trpc/routers/changes/git-operations.test.ts"))
TESTED.append((EP,"src/lib/trpc/routers/changes/git-operations.test.ts"))
TESTED.append((PU,"src/lib/trpc/routers/changes/utils/pull-request-url.test.ts"))


F("scripts/patch-dev-protocol.test.ts","file","moderate","Unit tests for the patch-dev-protocol script's worktree segment and workspace-name derivation helpers.",["test","script","worktree","dev-protocol"])
F("scripts/patch-dev-protocol.ts","file","complex","Dev-only script that patches the Electron app's custom protocol scheme and bundle identity per worktree so deep links resolve to the right workspace.",["script","dev-protocol","worktree","electron","deep-link"])
F("src/lib/electron-app/factories/app/setup.ts","file","moderate","App setup factory wiring Electron app lifecycle events (ready, activate, web-contents) to window creation and external link handling.",["electron","app-lifecycle","window","factory"])
F("src/lib/electron-app/factories/windows/create.ts","file","simple","Window factory that creates a BrowserWindow, registers its route, and routes external links to the system browser.",["electron","browser-window","factory","routing"])
F("src/lib/electron-app/utils/ignore-console-warnings.ts","file","simple","Utility that suppresses specific Electron/Node process warnings by filtering emitWarning output.",["electron","console","warnings","util"])
F("src/lib/trpc/index.ts","file","moderate","tRPC base setup exposing the router, mergeRouters, publicProcedure, and shared trpc instance for all desktop routers.",["trpc","router","ipc","setup"])
F("src/lib/trpc/routers/analytics/index.ts","file","simple","tRPC router exposing analytics identity mutation that sets the PostHog user id.",["trpc","analytics","posthog","router"])
F("src/lib/trpc/routers/auth/index.ts","file","complex","tRPC auth router handling token load/save, host identity, OAuth deep-link initiation, auth-event subscriptions, and logout.",["trpc","auth","oauth","token","router"])
F("src/lib/trpc/routers/auth/utils/auth-functions.ts","file","moderate","Auth helpers for encrypted token persistence, OAuth state store, deep-link parsing, and auth event emission.",["auth","token","oauth","deep-link","events"])
F("src/lib/trpc/routers/auth/utils/crypto-storage.ts","file","moderate","AES-GCM encrypt/decrypt helpers keyed by a machine-derived scrypt key for at-rest token storage.",["crypto","encryption","aes-gcm","storage","security"])
F("src/lib/trpc/routers/auto-update/index.ts","file","moderate","tRPC router exposing auto-update status subscription plus check/install/dismiss and simulation mutations.",["trpc","auto-update","electron","router"])
F("src/lib/trpc/routers/browser-history/index.ts","file","moderate","tRPC router for querying, searching, recording, and clearing local browser history via the local DB.",["trpc","browser-history","local-db","router"])
F("src/lib/trpc/routers/browser/browser.ts","file","complex","tRPC router driving the embedded browser: navigation, reload, screenshot, JS eval, console logs, event subscriptions, and storage clearing.",["trpc","browser","webcontents","navigation","router"])
F("src/lib/trpc/routers/cache/index.ts","file","simple","tRPC router that clears the Electron default session storage/cache.",["trpc","cache","session","router"])
F("src/lib/trpc/routers/changes/branches.ts","file","complex","tRPC branches router plus helpers listing local/remote branches with dates, default branch, and checked-out branches per worktree.",["trpc","git","branches","worktree","router"])
F("src/lib/trpc/routers/changes/file-contents.ts","file","complex","tRPC router and helpers resolving working/committed/staged/base file versions for diff viewing.",["trpc","git","diff","file-contents","router"])
F("src/lib/trpc/routers/changes/git-operations.test.ts","file","complex","Unit tests for git-operations helpers including upstream-missing detection and existing-PR push targeting.",["test","git","push","pull-request"])
F("src/lib/trpc/routers/changes/git-operations.ts","file","complex","tRPC git operations router (commit, push, PR create/merge, discard) with local-branch resolution and upstream error detection.",["trpc","git","commit","push","pull-request","router"])
F("src/lib/trpc/routers/changes/git-utils.ts","file","simple","Small predicates classifying git error messages (upstream missing, no PR found).",["git","errors","util","predicate"])
F("src/lib/trpc/routers/changes/index.ts","file","simple","Aggregator tRPC router composing branches, file-contents, git-operations, staging, and status sub-routers.",["trpc","changes","router","composition"])
F("src/lib/trpc/routers/changes/security/git-commands.ts","file","complex","Security-hardened git command wrappers (switch, checkout, stage, unstage, discard, stash) with path validation and hook tolerance.",["git","security","staging","stash","commands"])
F("src/lib/trpc/routers/changes/security/path-validation.ts","file","complex","Path-safety layer validating worktree registration and resolving relative paths to prevent traversal outside registered worktrees.",["security","path-validation","worktree","traversal","git"])
F("src/lib/trpc/routers/changes/staging.ts","file","complex","tRPC staging router for staging/unstaging/discarding files and deleting untracked files with status-cache invalidation.",["trpc","git","staging","status-cache","router"])
F("src/lib/trpc/routers/changes/status.ts","file","moderate","tRPC status router returning cached or freshly computed git working-tree status via a worker task runner.",["trpc","git","status","cache","router"])
F("src/lib/trpc/routers/changes/utils/existing-pr-push-target.ts","file","moderate","Helpers deciding whether to retarget a push to an existing open PR's head repo and resolving the matching remote.",["git","push","pull-request","remote","util"])
F("src/lib/trpc/routers/changes/utils/git-push.ts","file","complex","Push utilities covering tracking-ref detection, upstream setup, fetch, PR-aware push retargeting, and non-fast-forward handling.",["git","push","upstream","pull-request","tracking"])
F("src/lib/trpc/routers/changes/utils/merge-pull-request.ts","file","moderate","Helper that merges a pull request via the GitHub CLI and clears related worktree status caches.",["git","pull-request","merge","github","util"])
F("src/lib/trpc/routers/changes/utils/pull-request-discovery.ts","file","complex","Discovers existing open PRs by head commit/branch and builds new-PR compare URLs against the merge base.",["git","pull-request","github","discovery","url"])
F("src/lib/trpc/routers/changes/utils/pull-request-url.test.ts","file","simple","Unit tests for GitHub PR URL normalization and compare-URL building.",["test","pull-request","url","github"])
F("src/lib/trpc/routers/changes/utils/pull-request-url.ts","file","simple","Helpers normalizing GitHub repo URLs and building pull-request compare URLs from upstream refs.",["git","pull-request","url","github","util"])
F("src/lib/trpc/routers/changes/utils/status-cache.ts","file","moderate","In-memory TTL cache for git status results with in-flight dedup and per-worktree invalidation.",["git","status","cache","ttl","dedup"])
F("src/lib/trpc/routers/changes/utils/worktree-status-caches.ts","file","simple","Aggregator clearing both git status and GitHub caches for a worktree in one call.",["git","cache","worktree","github","util"])
F("src/lib/trpc/routers/chat-runtime-service/index.ts","file","moderate","tRPC chat runtime service router resolving notification ids from sessions and handling agent lifecycle events.",["trpc","chat","runtime","notifications","router"])
F("src/lib/trpc/routers/chat-service/index.ts","file","simple","Thin tRPC chat service router re-exporting the chat service instance and factory.",["trpc","chat","service","router"])
F("src/lib/trpc/routers/config/config.ts","file","complex","tRPC config router with setup-default detection, config-file existence/creation, and configured-script inspection.",["trpc","config","setup","detection","router"])



# GENERATE
def slug(path): return path
def file_node(path):
    m=FILES[path]
    return {"id":"file:"+path,"type":m["type"],"name":path.split("/")[-1],
            "filePath":path,"summary":m["summary"],"tags":m["tags"],"complexity":m["cx"]}

nodes_by_file={}
for path in FILES: nodes_by_file.setdefault(path,[]).append(file_node(path))

fnnodes={}
for f in FNS:
    nid=("class:" if f["type"]=="class" else "function:")+f["path"]+":"+f["name"]
    node={"id":nid,"type":f["type"],"name":f["name"],"filePath":f["path"],
          "summary":f["summary"],"tags":f["tags"],
          "complexity":"simple" if (f["e"]-f["s"])<50 else ("moderate" if (f["e"]-f["s"])<=200 else "complex"),
          "lineRange":[f["s"],f["e"]]}
    fnnodes[nid]=node
    nodes_by_file.setdefault(f["path"],[]).append(node)

nodeids=set()
for path in nodes_by_file:
    for n in nodes_by_file[path]: nodeids.add(n["id"])

edges=[]
def E(s,t,typ,w):
    if s==t: return
    edges.append({"source":s,"target":t,"type":typ,"direction":"forward","weight":w})

# imports
for path,imps in IMPORTS.items():
    for tgt in imps:
        E("file:"+path,"file:"+tgt,"imports",0.7)
# contains + exports
for f in FNS:
    nid=("class:" if f["type"]=="class" else "function:")+f["path"]+":"+f["name"]
    E("file:"+f["path"],nid,"contains",1.0)
    if f["exp"]: E("file:"+f["path"],nid,"exports",0.8)
# calls
for s,t in CALLS: E(s,t,"calls",0.8)
# tested_by
for prod,test in TESTED: E("file:"+prod,"file:"+test,"tested_by",0.5)

nodeCount=len(nodeids)
edgeCount=len(edges)
print("nodeCount",nodeCount,"edgeCount",edgeCount)

INTER=os.path.join(BASE,".ua/intermediate")
os.makedirs(INTER,exist_ok=True)

def write_all(nodes,edges,fp):
    json.dump({"nodes":nodes,"edges":edges},open(fp,"w"),indent=1)

if nodeCount<=60 and edgeCount<=120:
    allnodes=[]
    for path in sorted(FILES): allnodes+=nodes_by_file[path]
    write_all(allnodes,edges,os.path.join(INTER,"batch-1.json"))
    print("wrote batch-1.json")
else:
    parts=math.ceil(max(nodeCount/60,edgeCount/120))
    files=sorted(FILES)
    size=math.ceil(len(files)/parts)
    chunks=[files[i:i+size] for i in range(0,len(files),size)]
    parts=len(chunks)
    for k,chunk in enumerate(chunks,1):
        cnodes=[]
        cnodeids=set()
        for path in chunk:
            for n in nodes_by_file[path]:
                cnodes.append(n); cnodeids.add(n["id"])
        cedges=[e for e in edges if e["source"] in cnodeids]
        write_all(cnodes,cedges,os.path.join(INTER,"batch-1-part-%d.json"%k))
        print("part",k,"files",len(chunk),"nodes",len(cnodes),"edges",len(cedges))
    print("parts",parts)





