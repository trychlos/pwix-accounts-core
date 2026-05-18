# pwix:accounts-core - README

## What is it ?

Configurations, functions and tools used by both `pwix:accounts-ui` and `pwix:accounts-manager`, gathered here to help and mutualize the accounts management.

_Note_: According to [Accounts API](https://docs.meteor.com/api/accounts), "[...] an email address may belong to at most one user". According to [Passwords API](https://docs.meteor.com/api/passwords), "[...] if there are existing users with a username or email only differing in case, createAccount will fail". We so consider in this package first, and more globally in all our applications, that both the email address and the username can be used as a - case insensitive - user account identifier.

`pwix:accounts-core` provides following features:

- let the caller manage several instance of accounts collections, each of them being stored in distinct storages, and configured in distinct ways

- define email addresses and usernames minimum and maximum cardinalities

- define a preferred label when about to display a user identity.

But, in its most sample flavor, `pwix:accounts-core` is just an thin encapsulation around the Meteor `accounts-base` package to manage the standard `users` collection.

## Rationale

Most of the time, an application manages a single accounts collection, and Meteor defines for this usage a standard `users` collection. Standard packages, as `accounts-base`, `accounts-password`, and so on, act on this standard collection.

But you may have the case where the application not only needs this standard collection, but also wants manage other accounts entities. See for example anything which would look like an identity manager, or a multi-tenants application which would store each accounts of a tenant in its own collection.

Mutualizing most of the needed tools and configurations requires so that each of these accounts entities may be configured, and managed separately. This is the goal of this package.

## Account management

Meteor proposes a default standard 'users' accounts collection, and provides packages to manage it, and notably `accounts-base` and `accounts-password`. These package manage the accounts collection in such a way that there can be only **one** accounts collection in a Meteor system.

This is not very troublesome as long as we look at the user interface, or the collection schema, as they are easily overridable.

But we enter in trouble as soon as we want take advantage of password reset, account enrollment or email verification workflows for other accounts collections. These are so tied to the 'users' collection itself that it is not possible to configure them to use, for example, different templates or different callbacks on another collection.

## Installation

This Meteor package is installable with the usual command:

```sh
    meteor add pwix:accounts-core
    meteor npm install email-validator lodash multiple-select zxcvbn --save
```

## Usage

Just add the package to your application, and enjoy!

## What does it provide ?

### `AccountsCore`

The exported `AccountsCore` global object provides following items:

#### Classes

##### `acAccount`

The class doesn't extend the `Accounts` object from `accounts-base`, but encapsulates it to manage the configuration of our accounts.

This class is expected to be instanciated once by the application for each of the managed accounts collections. These instances must all be named. Other packages, such as `pwix-accounts-ui` and `pwix:accounts-manager` for example, will so be able to use these named instances.

But, for compatibility and simplicity reasons, doing nothing in your application will just instanciate and manage a `users` collection which happens to map to the standard `Meteor.users` collection.

###### Methods

- `acAccount( args<Object> ): acAccount`

    The class constructor is called with an object as argument, with following keys:

    - `name`

        The name of the instance.

        Defaults to 'users' and thus addresses the standard `Meteor.users` collection.

    - `allowFn`

        An async function which will be called with an action string identifier, and must return whether the current user is allowed to do the specified action.

        If the function is not provided, then the default is to **allow** all actions.

        `allowFn` prototype is: `async allowFn( action<String>, userId<String>, { instance: <AccountsCore.Account> [, ...<Any> ] }): Boolean`, where:
        
        - `userId` is the identifier of the requester user.
        - `instance` is an instance of `AccountsCore.Account`.

        Since v2.0.

    - `cleanRegexes`

        A list of regular expressions that field must NOT match to be sent to the client.

        It defaults to:

        ```js
            cleanRegexes: [
                'resume',
                'password',
                'profile'
            ]
        ```

        This list of regular expressions is used by the `cleanupUserDocument()` transformation to filter all records sent back to the client.

        Since v2.0.

    - `collection`

        The name of the underlying Mongo collection, defaulting to the name of the instance.

    - `haveEmailAddress`
    - `haveUsername`

        Whether the application wants these accounts be configured with or without an email address (resp. a username), and whether it is optional or mandatory.

        For each of these terms, accepted values are:

        - `AccountsCore.C.Identifier.NONE`: the field is not displayed nor considered
        - `AccountsCore.C.Identifier.OPTIONAL`: the field is proposed to the user, but may be left empty
        - `AccountsCore.C.Identifier.MANDATORY`: the input field must be filled by the user

        At least one of these fields MUST be set as `AccountsCore.C.Identifier.MANDATORY`. Else, the default value will be applied.

        Defauts to:

        - `haveEmailAddress`: `AccountsCore.C.Identifier.MANDATORY`
        - `haveUsername`: `AccountsCore.C.Identifier.NONE`

        Please be conscious that some features of your application may want display an identifier for each user. It would be a security hole to let the application display a verified email address anywhere, as this would be some sort of spam magnet!

        Starting with v2.0, these two booleans are superseded by minimal and maximal cardinalities below.

    - `hooksCommon`

        Creating a new user account, updating or deleting it, are features managed from common-code correspondant functions `AccountsCore.createAccount()`, `AccountsCore.updateAccount()` and `AccountsCore.deleteAccount()`. These functions are able to directly execute the relevant code for 'users' collection, and try to provide suitable defaults for other collections. But it may come time where you want take more control about the execution. Thus below (optional) hooks:

        - `createAccountFn`
        - `createAccountArgs`

        - `deleteAccountFn`
        - `deleteAccountArgs`

        - `updateAccountFn`
        - `updateAccountArgs`

            These functions respectively creates, updates or deletes a user account.

            Arguments can be provided as an object, or a function which returns such an object.

            Expected prototype is `async accountFn( userDoc<Object|String>, options<Object> [, accountArgs<Any> ] ): <Object>`.

            The returned object should be the same than those of the common entry point function below.

            The `options` object may contain following keys:

            - `instance`: the AccountsCore.Account instance, defaulting to 'users'
            - `userId`: the user identifier responsible of the request (none of them can be anonymous unless maybe the createAccountFn).

            When passed to `updateAccountFn()`, the `options` object may also contain:

            - `orig`: the original document.

        All `hooksCommon` functions which are provided must be callable both from client and server sides.

    - `hooksServer`

        An optional object which gathers server-side hooks:

        - `async preCreateFn( userDoc<Object>, userId<String> ): <void>`
        - `async postCreateFn( userDoc<Object>, userId<String> ): <void>`

        - `async preDeleteFn( userDoc<Object>, userId<String> ): <void>`
        - `async postDeleteFn( userDoc<Object>, userId<String> ): <void>`

        - `async preUpdateFn( userDoc<Object>, userId<String>, opts<Object> ): <void>`
        - `async postUpdateFn( userDoc<Object>, userId<String>, opts<Object> ): <void>`

            These functions can modify in place the `userDoc` document.

            The `pre`-functions should throw an error if they want cancel the operation.

        These hooks are only called from server side.

    - `informWrongEmail`

        Whether to inform the user that the email address he/she has entered when asking for resetting a password is not known of our users database.

        _Rationale:_

        Meteor default is to return a `[403] Something went wrong. Please check your credentials.` error message.

        Some security guys consider that returning such error would let a malicious user to check which email addresses are registered - or not - in the accounts database, so would lead to a potential confidentiality break and information leak.

        This parameter let the application decide what to do:

        - `AccountsCore.C.WrongEmail.OK`: say the user that the email has been sucessfully sent, even when this is not the case, thus silently ignore the error
        - `AccountsCore.C.WrongEmail.ERROR`: say the user that something went wrong (Meteor standard behavior).

        Defaults to `AccountsCore.C.WrongEmail.ERROR`.

    - `minEmailAddressesCount`
    - `maxEmailAddressesCount`
    - `minUsernamesCount`
    - `maxUsernamesCount`

        These parameters extend `haveEmailAddress` and `haveUsername` semantics to determine minimum and maximum email addresses and usernames count. They are read as follow:

        - when specified, minimum count must be an integer
        - when specified, maximum count can an integer or the constant value `AccountsCore.C.Cardinality.ILLIMITED`
        - minimum must be less or equal to maximum.

        Defaults are:

        - `minEmailAddressesCount`: 1
        - `maxEmailAddressesCount`: `AccountsCore.C.Cardinality.ILLIMITED`
        - `minUsernamesCount`: 0
        - `maxUsernamesCount`: 0

        Unless `haveEmailAddress` or `haveUsername` are specified, these new parameters take precedence other old ones.

        Since v2.0.

        **Whatever pre-v2.0 or post-v2.0 system you use, you MUST take care of having a user account identifier, either an email addresse or a username.**

    - `passwordLength`

        The minimal required password length when setting a new password, either when creating a new account of when changing the password of an existing account.

        The package doesn't hardcodes by itself a minimal 'minimal length', and so will accept even a minimal length of, say, 1 character!

        Defaults to ten (10) characters.

        **Please note that, for security reasons, you shouldn't set the minimal password length less than this default, unless you are absolutely sure of what you are doing.**

    - `passwordStrength`

        The minimal required password strength when setting a new password, either when creating a new account of when changing the password of an existing account.

        `pwix:accounts-core` makes use of the [zxcvbn](https://www.npmjs.com/package/zxcvbn) package to estimate the strength of entered passwords. The estimated strength can take folloging values:

        - `AccountsCore.C.Password.VERYWEAK`: too guessable, risky password (guesses < 10^3)
        - `AccountsCore.C.Password.WEAK`: very guessable, protection from throttled online attacks (guesses < 10^6)
        - `AccountsCore.C.Password.MEDIUM`: somewhat guessable, protection from unthrottled online attacks (guesses < 10^8)
        - `AccountsCore.C.Password.STRONG`: safely unguessable, moderate protection from offline slow-hash scenario (guesses < 10^10)
        - `AccountsCore.C.Password.VERYSTRONG`: very unguessable, strong protection from offline slow-hash scenario (guesses >= 10^10)

        The package doesn't hardcodes by itself a minimal 'required strength', and so will accept even a minimal length of, say, `AccountsCore.C.Password.VERYWEAK`!

        Defaults to `AccountsCore.C.Password.STRONG`.

        **Please note that, for security reasons, you shouldn't set the password required strength less than this default, unless you are absolutely sure of what you are doing.**

    - `preferredLabel`

        When not explicitely specified, which label choose to qualify a user account ? Following values are accepted:

        - `AccountsCore.C.PreferredLabel.USERNAME`
        - `AccountsCore.C.PreferredLabel.EMAIL_ADDRESS`

        Defaults to `AccountsCore.C.PreferredLabel.EMAIL_ADDRESS`, though the actually displayed label heavily depends of the runtime configuration as we try to always display something. At the last, the returned label may be nothing else than the document identifier.

    - `usernameLength`

        The minimal required username length.

        The package doesn't hardcodes by itself a minimal 'minimal length'.

        Defaults to six (6) characters.

- `async byAnyIdentifier( anyId<String>, options<Object> ): userDoc<Object>|null`
- `async byEmailAddress( email<String>, options<Object> ): userDoc<Object>|null`
- `async byId( userId<String>, options<Object> ): userDoc<Object>|null`
- `async byUsername( username<String>, options<Object> ): userDoc<Object>|null`

    The function returns a Promise which will eventually resolve to the unique cleaned-up user document, or null.

- `async checkEmailAddress( email<String>, options<Object> ): true|false`
- `async checkPassword( password<String>, options<Object> ): true|false`
- `async checkUsername( emaikl<String>, options<Object> ): true|false`

    Method equivalents of `AccountsCore.Checks.checkEmailAddress()`, `AccountsCore.Checks.checkEmailAddress()` and `AccountsCore.Checks.checkEmailAddress()` respectively.

- `emailAtLeastOne(): true|false`
- `emailMayHaveOne(): true|false`

    Whether we may have one or we want at least one email address.

- `async preferredLabel( userId|userDocument [, preferred] )`

    The function returns a Promise which will eventually resolve to the result object:

    - `label`: the computed preferred label

    - `origin`: the origin, which may be `ID` if the account has not been found, or `AccountsCore.C.PreferredLabel.USERNAME` or `AccountsCore.C.PreferredLabel.EMAIL_ADDRESS`.

    The application may have asked for either a username or an email address, or both.

    When time comes to display an identification string to the user, we need to choose between the username and the email address (if both apply), depending of the preference of the caller.

    The caller preference is optional, may be one the following values:

    - `AccountsCore.C.PreferredLabel.USERNAME`
    - `AccountsCore.C.PreferredLabel.EMAIL_ADDRESS`

    Default is the value configured at instanciation time.

- `transformsPublish( instance<AccountsCore.Account>, publication<String> ): <Array>`

    On client side, the method returns null.

    On server side, the method returns the current transformation functions array for the named publication, and let the caller examines it, reset it or update it.

    Prototype of the transformation functions is `async fn( instance<AccountsCore.Account>, userDoc<Object>, options<Object>, userId<String> ): userDoc<Object>`, where:

    - `options` is the options passed to the publication function with added keys:

        - `type`: 'publish'
        - `source`: the publication name,
        - `index`: the index of the transformation function, counted from zero

    - `userId` is the identifier of the user who has subscribed to the publication.

    Default transformation on publications is to add the `preferredLabel()` result inside of a `DYN` sub-object.

    Available both on the client and the server.

- `transformsRead( instance<AccountsCore.Account> ): <Array>`

    On client side, the method returns null.

    On server side, the method returns the current transformation functions array for read accesses, and let the caller examines it, reset it or update it.

    Prototype of the transformation functions is `async fn( instance<AccountsCore.Account>, userDoc<Object>, options<Object> ): userDoc<Object>`, where:

    - `options` is the options passed to the read function - usually Mongo qualifiers - with added keys:

        - `type`: 'read'
        - `source`: the read function name,
        - `index`: the index of the transformation function, counted from zero.

    Default transformation on read accesses is to add the `preferredLabel()` result inside of a `DYN` sub-object.

    Available both on the client and the server.

- `transformsUpdate( instance<AccountsCore.Account> )`

    On client side, the method returns null.

    On server side, the method returns the current transformation functions array for update accesses, and let the caller examines it, reset it or update it.

    Prototype of the transformation functions is `async fn( instance<AccountsCore.Account>, userDoc<Object>, options<Object> ): userDoc<Object>`, where:

    - `options` is the options passed to the update function - maybe `orig` and Meteor qualifiers - with added keys:

        - `type`: 'update'
        - `source`: the update function name,
        - `index`: the index of the transformation function, counted from zero.

    Note that writers of transformation functions for update accesses should wonder if they want modify the document itself, or clone the document before mmodifying it.

    Default transformation on update accesses is to remove the `DYN` sub-object. The function returns a modified clone of the initial document.

    Available both on the client and the server.

- `usernameAtLeastOne(): true|false`
- `usernameMayHaveOne(): true|false`

    Whether we may have one or we want at least one username.

##### `Options`

The class extends the `Options.Base` class to reactively manage `acAccount` instanciation arguments.

In other words, all instanciation arguments are available through `<my_acAccount_instance>.opts().<my_argument>()`, e.g. `acInstance.opts().minEmailAddressesCount()`.

#### `AccountsCore.Checks` helpers

This object hosts check functions:

- `async checkEmailAddress( instance<acAccount>, email<String>, opts={} ): <Object>`

    Check an email address for validity and existance, and returns a result object as:

```js
    ok: true,
    reason: undefined,
    errors: [],
    countOk: 0,
    countNotOk: 0,
    canonical: ( email ? email.trim() : '' ).toLowerCase()
```

- `async checkPassword( instance<acAccount>, password<String>, opts={} ): <Object>`

    Check a password for strength, and returns a result object as:

```js
    ok: true,
    reason: undefined,
    errors: [],
    countOk: 0,
    countNotOk: 0,
    minScore: -1,
    zxcvbn: null,
    canonical: password || ''
```

- `async checkUsername( instance<acAccount>, password<String>, opts={} ): <Object>`

    Check a username for validity and existance, and returns a result object as:

```js
    ok: true,
    reason: undefined,
    errors: [],
    countOk: 0,
    countNotOk: 0,
    canonical: username ? username.trim() : ''
```

#### `AccountsCore.Transforms` helpers

This object hosts transformation functions used by `AccountsCore`, and which may be usefujl for other packages:

- `async addDyn( instance<acAccount>, itemDoc<Object>, options<Object>: itemDoc<Object>`

- `async addPreferredLabel( instance<acAccount>, itemDoc<Object>, options<Object>: itemDoc<Object>`

- `async cleanupUserDocument( instance<acAccount>, itemDoc<Object>, options<Object>: itemDoc<Object>`

- `async removeDyn( instance<acAccount>, itemDoc<Object>, options<Object>: itemDoc<Object>`

#### Functions

##### `AccountsCore.areSame( userA<String|Object>, userB<String|Object> )`

Returns `true`|`false` depending if user A and user B are the same, whatever the way these users are identified, either by their id or by their user document.

##### `AccountsCore.configure( o<Object> ): <Object>`

The configuration of the package.

See [below](#configuration).

##### `async AccountsCore.createAccount( instance<Account|String>, userDoc<Object>, requesterId:<String> ): <Boolean>`

The entry point for all new accounts creation. It is available both on the client and the server.

This call cannot be anonymous, and the `requesterId` is checked against the `pwix.AccountsCore.feat.create` permission.

It then calls the `hooksCommon.createAccountFn()` if defined, or delegates to `Accounts.createAccount()` for the `users` collection, or at last just insert the given user document in the given collection.

Whatever the side of the originating call, the creation flow eventually arrives on server-side: update transformations are applied and server hooks `preCreateFn` and `postCreateFn` are honored.

The function returns an object with:

- on success:

    - `_id`: the newly inserted identifier

- on failure:

    - `reason`: the reason of the failure
or
    - `reason_i18n`: the string index of the localized reason of the failure

##### `async AccountsCore.deleteAccount( instance<Account|String>, userDoc<Object>, requesterId:<String> ): <Boolean>`

Available both on the client and the server.

##### `AccountsCore.i18n.namespace(): <String>`

This method returns the `pwix:i18n` namespace of the `pwix:accounts-core` package.

With that name, anyone is so able to provide additional translations.

##### `async AccountsCore.isAllowed( action<String>, userId<String>, args<Object> ): <Boolean>`

Manages permissions to the accounts.

The provided `args` argument MUST contain an `instance` key with an instance of `AccountsCore.Account` or the name of such an instance.

Available both on the client and the server.

##### `AccountsCore.runAccountsSelection( selected<ReactiveVar>, opts<Object> )`

Runs a modal dialog to let the user choose zero to many user accounts.

Parameters are:

- `selected`: a ReactiveVar which contains the array of initially selected accounts identifiers (`_id`)

    This same ReactiveVar will contain the selection result when the dialog will be validated.

- `opts`: an optional options object with following keys:

    - `disabled`: whether the selection component should be disabled, defaulting to `false`
    - `selectOptions`: additional configuration options for `multiple-select` selection component
    - `instance`: the name of the accounts instance, defaulting to 'users'
    - `select_ph`: the select component placeholder, defaulting to (localized) 'Select the desired accounts'
    - `dialog_title`: the dialog title, defaulting to (localized) 'Select one or more user accounts'
    - `$target`: a jQuery object which will receive the 'ah-accounts-select' event at the validation of the dialog

The modal triggers an 'ac-accounts-select' event at validation time, with data as:

- `selected`: an array of selected accounts identifiers.

This function is available on client-side only.

##### `async AccountsCore.updateAccount( instance<Account|String>, userDoc<Object>, requesterId:<String>, opts<Object> ): <Boolean>`

`opts` is an optional options object wich may contain:

- `orig`: the original user document, which let the server-side function check for unchangeness

- other Meteor options suitable for updateAsync() Mongo function.

Available both on the client and the server.

## Blaze components

### `acPreferredLabel`

A component which asynchrously displays the user preferred label.

It accepts following data context:

- `acName`

    The name of the `AccountsCore.Account` instance, defaulting to 'users'.

- `acUserLabel`

    The label to be displayed, defaulting to the preferred label of identified user (see below).

- `acUserId`

    The identifier of the user to be considered.

## Publications

### `pwix.AccountsCore.p.listAll( instanceName<String> )`

This publishes a cursor of all accounts in the named collection. It is subject to the `pwix.accounts_core.feat.list` permission.

Each published document:

- is cleaned up from confidential data

- has a `DYN` subject which contains:

    - preferredLabel: the result of the `AccountsCore.preferredLabel()` function

## Permissions management

This package can take advantage of `pwix:permissions` package to manage the user permissions.

It defines following tasks:

- `pwix.accounts_core.feat.create`: create a new account, with additional arguments as an object with following keys:

    - instance: the `AccountsCore.Account` instance

- `pwix.accounts_core.feat.delete`: delete an account, with additional arguments as an object with following keys:

    - instance: the `AccountsCore.Account` instance

- `pwix.accounts_core.feat.list`: display all accounts, with additional arguments as an object with following keys:

    - instance: the `AccountsCore.Account` instance

- `pwix.accounts_core.feat.update`: update an account, with additional arguments as an object with following keys:

    - instance: the `AccountsCore.Account` instance

Please remind that default is to allow all actions which are not provided.

## Configuration

The package's behavior can be configured through a call to the `AccountsCore.configure()` method, with just a single javascript object argument, which itself should only contains the options you want override.

Known configuration options are:

- `autoUsers`

    Whether to automatically instanciates a `acAccount` instance for the standard `users` collection, defaulting to `true`.

    When `true` (the default), then the `acAccount` instance will be instanciated at startup time.

    Note: do NOT leave default `autoUsers` to `true` if you are too using `pwix:accounts-manager`. This is because this later extends the accounts class, and so expects to find back its own instances.

- `preferredLabelWarnsOnce`

    Whether to warn only once when the `acPreferredLabel` component doesn't find the requested user identifier, defaulting to `true`.

- `verbosity`

    The verbosity level as:

    - `AccountsCore.C.Verbose.NONE`

    or an OR-ed value of integer constants:

    - `AccountsCore.C.Verbose.CONFIGURE`

    Trace the calls to `configure()` function.

    - `AccountsCore.C.Verbose.FUNCTIONS`

    Trace all function calls.

    - `AccountsCore.C.Verbose.SERVER`

    Trace server function calls and their result.

    - `AccountsCore.C.Verbose.INSTANCE`

        Trace `amAccount` instanciation

    - `AccountsCore.C.Verbose.READY`

        Track the readyness status of the package.

    Defaults to `AccountsCore.C.Verbose.CONFIGURE`.

Please note that `AccountsCore.configure()` method should be called in the same terms both in client and server sides.

Remind too that Meteor packages are instanciated at application level. They are so only configurable once, or, in other words, only one instance has to be or can be configured. Addtionnal calls to `AccountsCore.configure()` will just override the previous one. You have been warned: **only the application should configure a package**.

## NPM peer dependencies

In accordance with advices from [the Meteor Guide](https://guide.meteor.com/writing-atmosphere-packages.html#peer-npm-dependencies), we do not hardcode NPM dependencies in `package.js`. Instead we check npm versions of installed packages at runtime, on server startup, in development environment.

Dependencies as of v 2.2.0:

```js
    'email-validator': '^2.0.4',
    'lodash': '^4.17.0',
    'zxcvbn': '^4.4.2'
```

Each of these dependencies should be installed at application level:

```sh
    meteor npm install <package> --save
```

## Translations

`pwix:accounts-core` provides at the moment **fr** and **en** translations.

New and updated translations are willingly accepted, and more than welcome. Just be kind enough to submit a PR on the [Github repository](https://github.com/trychlos/pwix-accounts-core/pulls).

## Cookies and comparable technologies

None at the moment.

## Issues & help

In case of support or error, please report your issue request to our [Issues tracker](https://github.com/trychlos/pwix-accounts-core/issues).

---
P. Wieser
- Last updated on 2026, May. 10th
