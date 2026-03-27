/*
 * pwix:accounts-core/src/common/js/startup.js
 */

// at startup, instanciates a default acAccount instance for the standard 'users' collection
Meteor.startup(() => {
    if( AccountsCore.configure().autoUsers && !AccountsCore.getInstance( 'users' )){
        new AccountsCore.acAccount({ name: 'users' });
    }
});
