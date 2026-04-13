# pwix:accounts-core

## ChangeLog

### 2.1.1-rc.0

    Release date: 

    - 

### 2.1.0

    Release date: 2026- 4-13

    - Define AccountsCore.Config.get() getter for Accounts configuration options, thus bumping minor candidate version number
    - Exported AccountsCore.acAccount class is renamed to AccountsCore.Account
    - Extend Transforms.cleaupUserDocument() to be able to keep some fields
    - Define emailMaxCount(), emailMinCount() and usernameMaxCount(), usernameMinCount() which honor both haveXxx and min/max counts parameters
    - Define applyPublishTransforms(), applyReadTransforms(), applyUpdateTransforms(), updateByQuery() server functions
    - Make sure transformation functions are only available on server side
    - Systematize the createAccount(), deleteAccount(), updateAccount() public API, both client and server-side callable
    - Systematize the preCreateFn(), postCreateFn(), preDeleteFn(), postDeleteFn(), preUpdateFn() and postUpdateFn() server hooks
    - Systematize the createAccountFn(), deleteAccountFn(), updateAccountFn() common hooks
    - Now hosts the four CRUD permissions

### 2.0.0

    Release date: 2026- 4- 2

    - Improve configure() warns when a key doesn't exist
    - Improve installation instructions
    - Use pwix:logger universal logger, thus bumping minor candidate version number
    - Define a ready() reactive data source
    - Have a guard against having both autoUsers=true and pwix:accounts-manager package
    - Remove assert() tests, replacing with logger.error() for debugging facility
    - Introduce email address and username cardinalities
    - 'pwix.AccountsHub.p.listAll' now published also full roles of the target users
    - Introduce permissions control with 'allowFn' parameter
    - Make sure methods and publications are prefixed with a full namespace
    - AccountsHub is renamed AccountsCore, API interface is deeply reviewed, thus bumping major candidate version number
    - Remove unused 'onSignin' class argument
    - Define AccountsCore.byAnyIdentifier() besides of AccountsCore.byEmailAddress(), AccountsCore.byId() and AccountsCore.byUsername()
    - Remove unused 'sendVerificationEmail' class argument
    - ahPreferredLabel Blaze component is renamed to acPreferredLabel
    - Move accounts selection dialog to AccountsManager, removing relevant dependencies

### 1.3.0

    Release date: 2026- 2- 9

    - Define new 'autoUsers' configuration parameter to define or not a default 'users' instance, thus bumping minor candidate version number
    - Define new AccountsHub.getInstance() reactive data source
    - Update README, explaining where first update comes from

### 1.2.0

    Release date: 2025- 7- 8

    - Now hosts our standard Accounts createUser hooks, thus bumping minor candidate version number
    - Extend multiple-select dependency to v2.0.0
    - Update to pwix:ui-utils v1.4

### 1.1.0

    Release date: 2024-11-19

    - Remove dead code
    - Define new runAccountsSelection() function, thus bumping minor candidate version number
    - Add less dependency

### 1.0.0

    Release date: 2024-10- 4

    - Initial release

---
P. Wieser
- Last updated on 2026, Apr. 13rd
