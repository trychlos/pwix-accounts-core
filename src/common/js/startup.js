/*
 * pwix:accounts-core/src/common/js/startup.js
 */

// at startup, instanciates a default acAccount instance for the standard 'users' collection
Meteor.startup(() => {
    if( AccountsCore.configure().autoUsers && !AccountsCore.getInstance( AccountsCore.C.Users )){
        new AccountsCore.Account({ name: AccountsCore.C.Users });
    }
});
