/*
 * pwix:accounts-hub/src/common/js/startup.js
 */

// at startup, instanciates a default ahClass instance for the standard 'users' collection
Meteor.startup(() => {
    if( AccountsHub.configure().autoUsers && !AccountsHub.instances.users ){
        new AccountsHub.ahClass({ name: 'users' });
    }
});
