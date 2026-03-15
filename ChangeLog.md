# pwix:accounts-hub

## ChangeLog

### 1.4.0-rc.0

    Release date: 

    - Improve configure() warns when a key doesn't exist
    - Improve installation instructions
    - Use pwix:logger universal logger, thus bumping minor candidate version number
    - Define a ready() reactive data source
    - Have a guard against having both autoUsers=true and pwix:accounts-manager package
    - Remove assert() tests, replacing with logger.error() for debugging facility
    - Introduce email address and username cardinalities
    - 'pwix.AccountsHub.p.listAll' now published also full roles of the target users
    - Introduce permissions control with 'allowFn' parameter
    - Replace multiple-select NPM module with multiple-select-vanilla
    - Update to pwix:modal v2.5
    - Make sure methods and publications are prefixed with a full namespace

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
- Last updated on 2026, Feb. 9th
