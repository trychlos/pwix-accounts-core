# pwix:accounts-hub - README

## What is it ?

Configurations, functions and tools both used by `pwix:accounts-ui` and `pwix:accounts-manager`, gathered here to help the accounts management.

_Note_: According to [Accounts API](https://docs.meteor.com/api/accounts), "[...] an email address may belong to at most one user". According to [Passwords API](https://docs.meteor.com/api/passwords), "[...] if there are existing users with a username or email only differing in case, createUser will fail". We so consider in this package first, and more globally in our applications, that both the email address and the username can be used as a - case insensitive - user account identifier.

`pwix:accounts-hub` let the caller manage several instance of accounts collections, each of them being stored in distinct storages, and configured in distinct ways.

## Rationale

Most of the time, an application manages a single accounts collection, and Meteor defines for this usage a standard `users` collection. Standard packages, as `accounts-base`, `accounts-password`, and so on, act on this standard collection.

But you may have the case where the application not only needs this standard collection, but also wants manage other accounts entities. See for example anything which would look like an identity manager, or a multi-tenants application which would store each accounts of a tenant in its own collection.

Mutualizing most of the needed tools and configurations requires so that each of these accounts entities may be configured, and managed separately. This is the goal of this package.

## Account management

Meteor proposes a default standard 'users' accounts collection, and provides packages to manage it, and notably `accounts-base` and `accounts-password`. These package manage the accounts collection in such a way that there can be only **one** accounts collection in a Meteor system.

This is not very troublesome as long as we look at the user interface, or the collection schema, as they are easily overridable.

But we enter in trouble as soon as we want take advantage of password reset, account enrollment or email verification workflows. These are so tied to the collection itself that it is not possible to configure them to use, for example, different templates or different callbacks.

## Installation

This Meteor package is installable with the usual command:

```sh
    meteor add pwix:accounts-hub
    meteor npm install email-validator lodash multiple-select zxcvbn --save
```

## Usage

Just add the package to your application, and enjoy!

## What does it provide ?

### `AccountsHub`

The exported `AccountsHub` global object provides following items:

#### Classes

##### `ahClass`

This class is expected to be instanciated once by the application for each of the managed accounts entities. These instances must be all named. Other packages, such as `pwix-accounts-ui` and `pwix:accounts-manager` will all be able to use these named instances.

###### Methods

- `ahClass( args<Object> ): ahClass`

The class constructor is called with an object as argument, with following keys:

    - `name`

        The name of the instance.

        Defaults to 'users' and thus addresses the standard Meteor 'users' collection.

    - `haveEmailAddress`
    - `haveUsername`

        Whether the application wants these accounts be configured with or without an email address (resp. a username), and whether it is optional or mandatory.

        For each of these terms, accepted values are:

        - `AccountsHub.C.Identifier.NONE`: the field is not displayed nor considered
        - `AccountsHub.C.Identifier.OPTIONAL`: the field is proposed to the user, but may be left empty
        - `AccountsHub.C.Identifier.MANDATORY`: the input field must be filled by the user

        At least one of these fields MUST be set as `AccountsHub.C.Identifier.MANDATORY`. Else, the default value will be applied.

        Defauts to:

        - `haveEmailAddress`: `AccountsHub.C.Identifier.MANDATORY`
        - `haveUsername`: `AccountsHub.C.Identifier.NONE`

        Please be conscious that some features of your application may want display an identifier for each user. It would be a security hole to let the application display a verified email address anywhere, as this would be some sort of spam magnet!

    - `informWrongEmail`

        Whether to inform the user that the email address he/she has entered when asking for resetting a password is not known of our users database.

        Rationale:

            Meteor default is to return a `[403] Something went wrong. Please check your credentials.` error message.

            Some security guys consider that returning such error would let a malicious user to check which email addresses are registered - or not - in the accounts database, so would lead to a potential confidentiality break and information leak.

        This parameter let the application decide what to do:

        - `AccountsHub.C.WrongEmail.OK`: say the user that the email has been sucessfully sent, even when this is not the case
        - `AccountsHub.C.WrongEmail.ERROR`: say the user that something went wrong (Meteor standard behavior).

        Defaults to `AccountsHub.C.WrongEmail.ERROR`.

    - `onSignin`

        A client-side function to be called when the managed account wants to log in.

        Prototype of the function is `onSignin( userid<String>, credentials<Any> [, callback<Callback> ])`

        Defaults to standard `Meteor.loginWithPassword()`.

    - `passwordLength`

        The minimal required password length when setting a new password, either when creating a new account of when changing the password of an existing account.

        The package doesn't hardcodes by itself a minimal 'minimal length', and so will accept even a minimal length of, say, 1 character!

        Defaults to ten (10) characters.

        **Please note that, for security reasons, you shouldn't set the minimal password length less than this default, unless you are absolutely sure of what you are doing.**

    - `passwordStrength`

        The minimal required password strength when setting a new password, either when creating a new account of when changing the password of an existing account.

        `pwix:accounts-uhubi` makes use of the [zxcvbn](https://www.npmjs.com/package/zxcvbn) package to estimate the strength of entered passwords. The estimated strength can take folloging values:

        - `AccountsHub.C.Password.VERYWEAK`: too guessable, risky password (guesses < 10^3)
        - `AccountsHub.C.Password.WEAK`: very guessable, protection from throttled online attacks (guesses < 10^6)
        - `AccountsHub.C.Password.MEDIUM`: somewhat guessable, protection from unthrottled online attacks (guesses < 10^8)
        - `AccountsHub.C.Password.STRONG`: safely unguessable, moderate protection from offline slow-hash scenario (guesses < 10^10)
        - `AccountsHub.C.Password.VERYSTRONG`: very unguessable, strong protection from offline slow-hash scenario (guesses >= 10^10)

        The package doesn't hardcodes by itself a minimal 'required strength', and so will accept even a minimal length of, say, `AccountsHub.C.Password.VERYWEAK`!

        Defaults to `AccountsHub.C.Password.STRONG`.

        **Please note that, for security reasons, you shouldn't set the password required strength less than this default, unless you are absolutely sure of what you are doing.**

    - `preferredLabel`

        When not explicitely specified, which label choose to qualify a user account ? Following values are accepted:

        - `AccountsHub.C.PreferredLabel.USERNAME`
        - `AccountsHub.C.PreferredLabel.EMAIL_ADDRESS`

        Defaults to `AccountsHub.C.PreferredLabel.EMAIL_ADDRESS`, though the actually displayed label heavily depends of the runtime configuration as we try to always display something. At the last, the returned label may be nothing else than the document identifier.

    - `sendVerificationEmail`

        Whether to send a verification email to each newly created user.

        This should be kept by the application consistent with the same parameter of `accounts-base` Meteor package.

        Accepted values are `true` or `false`.

        Defaults to `true`.

        Please note that sending a verification email updates the Accounts collection, thus automatically set up `updatedAt`, `updatedBy` fields. If you ask where these updates come from, this is the first answer.

    - `serverAllExtend`

        A server-side function which comes to extend the content of the dataset published for the whole list.

        The function get the current entity item as its unique argument and returns a Promise when finished with its job.

        Defaults to `null`.

    - `usernameLength`

        The minimal required username length.

        The package doesn't hardcodes by itself a minimal 'minimal length'.

        Defaults to six (6) characters.

    - `collection`

        The name of the underlying Mongo collection, defaulting to `name`

- `async byEmailAddress( email [, options ]): Promise<ahClass|null>`

Returns a Promise which will resolve to the cleaned up document of the unique user which holds the provided email address, or null if none or several (which would be a bug anyway).

`options` is an optional dictionary of fields to return or exclude.

See also [findUserByEmail()](https://v3-docs.meteor.com/api/accounts.html#Accounts-findUserByEmail) Meteor function.`

- `async byUsername( username [, options ]): Promise<ahClass|null>`

Returns a Promise which will resolve to the cleaned up document of the unique user which holds the provided username, or null if none or several (which would be a bug anyway).

`options` is an optional dictionary of fields to return or exclude.

See also [findUserByUsername()](https://v3-docs.meteor.com/api/accounts.html#Accounts-findUserByUsername) Meteor function.`

- `async preferredLabel( id|user [, preferred] )`

The function returns a Promise which will eventually resolve to the result object.

The result object has following keys:

    - `label`: the computed preferred label

    - `origin`: the origin, which may be `ID` if the account has not been found, or `AccountsHub.C.PreferredLabel.USERNAME` or `AccountsHub.C.PreferredLabel.EMAIL_ADDRESS`.

The application may have ask for either a username or an email address, or both.
When time comes to display an identification string to the user, we need to choose between the username and the email address (if both apply), depending of the preference of the caller.

The caller preference is optional, may be one the following values:

    - `AccountsHub.C.PreferredLabel.USERNAME`
    - `AccountsHub.C.PreferredLabel.EMAIL_ADDRESS`

Default is the value configured at instanciation time.

#### Functions

##### `AccountsHub.onCreateUser( f<Function> )`

On server-side, push a new function on the stack of `Accounts.onCreateUser()` calls.

This only applies to `users` Meteor standard collection.

##### `AccountsHub.runAccountsSelection( selected<ReactiveVar>, opts<Object> )`

Runs a modal dialog to let the user choose zero to many user accounts.

Parameters are:

- `selected`: a ReactiveVar which contains the array of initially selected accounts identifiers (`_id`)

    This same ReactiveVar will contain the selection result when the dialog will be validated.

- `opts`: an optional options object with following keys:

    - `disabled`: whether the selection component should be disabled, defaulting to false
    - `selectOptions`: additional configuration options for (multiple-select) selection component
    - `instance`: the name of the accounts instance, defaulting to 'users'
    - `select_ph`: the select component placeholder, defaulting to (localized) 'Select the desired accounts'
    - `dialog_title`: the dialog title, defaulting to (localized) 'Select one or more user accounts'
    - `$target`: a jQuery object which will receive the 'ah-accounts-select' event at the validation of the dialog

The modal may trigger an 'ah-accounts-select' event at validation time, with data as:

    - `items`: an array of selected accounts documents
    - `selected`: an array of selected accounts identifiers.

This function is available on client-side only.

##### `AccountsHub.areSame( userA<String|Object>, userB<String|Object> )`

Returns `true`|`false` depending if user A and user B are the same, whatever the way these users are identified, either by their id or by their user document.

##### `AccountsHub.configure( o )`

The configuration of the package.

See [below](#configuration).

##### `AccountsHub.i18n.namespace()`

This method returns the `pwix:i18n` namespace of the `pwix:accounts-hub` package.

With that name, anyone is so able to provide additional translations.

## Blaze components

### `ahPreferredLabel`

A component which asynchrously displays the user preferred label.

It accepts following data context:

- `ahName`

    The name of the `AccountsHub.ahClass` instance, defaulting to 'users'.

- `ahUserLabel`

    The label to be displayed, defaulting to the preferred label of identifier user (see below).

- `ahUserId`

    The identifier of the user to be considered.

## Configuration

The package's behavior can be configured through a call to the `AccountsHub.configure()` method, with just a single javascript object argument, which itself should only contains the options you want override.

Known configuration options are:

- `autoUsers`

    Whether to automatically instanciates a `ahClass` instance for the standard `users` collection, defaulting to `true`.

    When `true` (the default), then the `ahClass` will be instanciated at startup time.

- `verbosity`

    The verbosity level as:

    - `AccountsHub.C.Verbose.NONE`

    or an OR-ed value of integer constants:

    - `AccountsHub.C.Verbose.CONFIGURE`

    Trace the calls to `configure()` function.

    - `AccountsHub.C.Verbose.FUNCTIONS`

    Trace all function calls.

    - `AccountsHub.C.Verbose.SERVER`

    Trace server function calls and their result.

    - `AccountsHub.C.Verbose.INSTANCE`

        Trace `amClass` instanciation

    - `AccountsHub.C.Verbose.READY`

        Track the readyness status of the package.

    Defaults to `AccountsHub.C.Verbose.CONFIGURE`.

Please note that `AccountsHub.configure()` method should be called in the same terms both in client and server sides.

Remind too that Meteor packages are instanciated at application level. They are so only configurable once, or, in other words, only one instance has to be or can be configured. Addtionnal calls to `AccountsHub.configure()` will just override the previous one. You have been warned: **only the application should configure a package**.

## NPM peer dependencies

In accordance with advices from [the Meteor Guide](https://guide.meteor.com/writing-atmosphere-packages.html#peer-npm-dependencies), we do not hardcode NPM dependencies in `package.js`. Instead we check npm versions of installed packages at runtime, on server startup, in development environment.

Dependencies as of v 1.3.0:

```js
    'email-validator': '^2.0.4',
    'lodash': '^4.17.0',
    'multiple-select': '^1.7.0 || ^2.0.0',
    'zxcvbn': '^4.4.2'
```

Each of these dependencies should be installed at application level:

```sh
    meteor npm install <package> --save
```

## Translations

`pwix:accounts-hub` provides at the moment **fr** and **en** translations.

New and updated translations are willingly accepted, and more than welcome. Just be kind enough to submit a PR on the [Github repository](https://github.com/trychlos/pwix-accounts-hub/pulls).

## Cookies and comparable technologies

None at the moment.

## Issues & help

In case of support or error, please report your issue request to our [Issues tracker](https://github.com/trychlos/pwix-accounts-hub/issues).

---
P. Wieser
- Last updated on 2026, Feb. 9th
