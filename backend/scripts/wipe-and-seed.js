const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

// ====================== SCHEMAS ======================

const UserSchema = new mongoose.Schema({
    username: String,
    email: String,
    passwordHash: String,
    email_verified: Boolean
}, { timestamps: true });

const GroupSchema = new mongoose.Schema({
    name: String,
    description: String,
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    members: [{
        _id: false,
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        displayName: String
    }],
    memberBalances: [{
        _id: false,
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        balance: Number
    }]
}, { timestamps: true });

const ExpenseSchema = new mongoose.Schema({
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
    description: String,
    amount: Number,
    paid_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    debtors: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        amount: Number
    }],
    paid_time: Date
}, { timestamps: true });

const SettlementSchema = new mongoose.Schema({
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
    from_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    to_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    description: String,
    settledAt: Date
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Group = mongoose.model('Group', GroupSchema);
const Expense = mongoose.model('Expense', ExpenseSchema);
const Settlement = mongoose.model('Settlement', SettlementSchema);

// ====================== HELPER ======================

const daysAgo = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
};

// ====================== MAIN ======================

async function wipeAndSeed() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected!');

    // 1. WIPE EVERYTHING
    console.log('\n🗑️  WIPING DATABASE...');
    try { await mongoose.connection.dropCollection('users'); } catch (e) { }
    try { await mongoose.connection.dropCollection('groups'); } catch (e) { }
    try { await mongoose.connection.dropCollection('expenses'); } catch (e) { }
    try { await mongoose.connection.dropCollection('settlements'); } catch (e) { }
    console.log('Collections dropped successfully.');

    // 2. SEED DATA
    console.log('\n🌱 SEEDING DATA...');
    const passwordHash = await bcrypt.hash('test123', 10);

    const usersData = [
        { username: 'testuser', email: 'testuser@example.com' },
        { username: 'alice', email: 'alice@example.com' },
        { username: 'bob', email: 'bob@example.com' },
        { username: 'charlie', email: 'charlie@example.com' },
        { username: 'diana', email: 'diana@example.com' }
    ];

    const users = {};
    for (const u of usersData) {
        users[u.username] = await User.create({
            username: u.username,
            email: u.email,
            passwordHash,
            email_verified: true
        });
        console.log('Created user:', u.username);
    }

    // JAPAN TRIP
    const japanTrip = await Group.create({
        name: 'Japan Trip 2024',
        description: 'Our amazing trip to Japan!',
        owner: users.testuser._id,
        members: [
            { user: users.testuser._id, displayName: 'Traveler' },
            { user: users.alice._id, displayName: 'Alice' },
            { user: users.bob._id, displayName: 'Bobby' }
        ],
        memberBalances: []
    });
    console.log('Created Japan Trip group');

    const japanMembers = [users.testuser._id, users.alice._id, users.bob._id];
    const japanExpenses = [
        { desc: 'Flight tickets (ANA)', amount: 2400, paidBy: users.testuser._id, days: 30 },
        { desc: 'Airbnb Tokyo - 5 nights', amount: 850, paidBy: users.alice._id, days: 28 },
        { desc: 'JR Rail Pass (7 days)', amount: 450, paidBy: users.bob._id, days: 27 },
        { desc: 'Sushi Omakase dinner', amount: 180, paidBy: users.testuser._id, days: 26 },
        { desc: 'Tokyo Skytree tickets', amount: 45, paidBy: users.alice._id, days: 25 },
        { desc: 'Ramen lunch', amount: 36, paidBy: users.bob._id, days: 25 },
        { desc: 'Shinkansen to Kyoto', amount: 120, paidBy: users.testuser._id, days: 24 },
        { desc: 'Ryokan in Kyoto - 2 nights', amount: 480, paidBy: users.alice._id, days: 23 },
        { desc: 'Fushimi Inari temple visit', amount: 0, paidBy: users.testuser._id, days: 22 },
        { desc: 'Kaiseki dinner', amount: 210, paidBy: users.bob._id, days: 22 },
        { desc: 'Nara day trip (deer park)', amount: 30, paidBy: users.testuser._id, days: 21 },
        { desc: 'Convenience store snacks', amount: 25, paidBy: users.alice._id, days: 20 },
        { desc: 'Osaka street food tour', amount: 75, paidBy: users.bob._id, days: 19 },
        { desc: 'Souvenirs & gifts', amount: 150, paidBy: users.testuser._id, days: 18 },
        { desc: 'Airport taxi', amount: 85, paidBy: users.alice._id, days: 17 }
    ];

    for (const exp of japanExpenses) {
        if (exp.amount === 0) continue;
        const splitAmount = exp.amount / japanMembers.length;
        await Expense.create({
            group: japanTrip._id,
            description: exp.desc,
            amount: exp.amount,
            paid_by: exp.paidBy,
            debtors: japanMembers.map(uid => ({ user: uid, amount: splitAmount })),
            paid_time: daysAgo(exp.days)
        });
    }
    console.log(`Created ${japanExpenses.filter(e => e.amount > 0).length} expenses for Japan Trip`);

    await Settlement.create({
        group: japanTrip._id,
        from_user: users.bob._id,
        to_user: users.testuser._id,
        amount: 200,
        description: 'Partial payment for flights',
        settledAt: daysAgo(15)
    });
    console.log('Created 1 settlement for Japan Trip');

    // ROOMMATES
    const roommates = await Group.create({
        name: 'Roommates',
        description: 'Monthly apartment expenses',
        owner: users.testuser._id,
        members: [
            { user: users.testuser._id, displayName: 'Roomie' },
            { user: users.charlie._id, displayName: 'Chuck' }
        ],
        memberBalances: []
    });
    console.log('Created Roommates group');

    const roommateMembers = [users.testuser._id, users.charlie._id];
    const roommateExpenses = [
        { desc: 'Rent - December', amount: 1600, paidBy: users.testuser._id, days: 5 },
        { desc: 'Electricity bill', amount: 95, paidBy: users.charlie._id, days: 7 },
        { desc: 'Internet (Fiber)', amount: 65, paidBy: users.testuser._id, days: 10 },
        { desc: 'Groceries - week 1', amount: 120, paidBy: users.charlie._id, days: 14 },
        { desc: 'Cleaning supplies', amount: 35, paidBy: users.testuser._id, days: 12 },
        { desc: 'Netflix subscription', amount: 15, paidBy: users.charlie._id, days: 3 },
        { desc: 'Water bill', amount: 40, paidBy: users.testuser._id, days: 8 },
        { desc: 'Groceries - week 2', amount: 95, paidBy: users.charlie._id, days: 7 },
        { desc: 'New coffee maker', amount: 80, paidBy: users.testuser._id, days: 6 },
        { desc: 'Groceries - week 3', amount: 110, paidBy: users.testuser._id, days: 2 }
    ];

    for (const exp of roommateExpenses) {
        const splitAmount = exp.amount / roommateMembers.length;
        await Expense.create({
            group: roommates._id,
            description: exp.desc,
            amount: exp.amount,
            paid_by: exp.paidBy,
            debtors: roommateMembers.map(uid => ({ user: uid, amount: splitAmount })),
            paid_time: daysAgo(exp.days)
        });
    }
    console.log(`Created ${roommateExpenses.length} expenses for Roommates`);

    // BRUNCH CLUB
    const brunchClub = await Group.create({
        name: 'Weekend Brunch Club',
        description: 'Sunday brunch with friends',
        owner: users.testuser._id,
        members: [
            { user: users.testuser._id, displayName: 'Foodie' },
            { user: users.alice._id, displayName: 'Ali' },
            { user: users.diana._id, displayName: 'Di' }
        ],
        memberBalances: []
    });
    console.log('Created Brunch Club group');

    const brunchMembers = [users.testuser._id, users.alice._id, users.diana._id];
    const brunchExpenses = [
        { desc: 'Brunch at The Breakfast Club', amount: 72, paidBy: users.testuser._id, days: 0 },
        { desc: 'Brunch at Sunny Side Cafe', amount: 85, paidBy: users.alice._id, days: 7 },
        { desc: 'Brunch at The Avocado Toast', amount: 66, paidBy: users.diana._id, days: 14 },
        { desc: 'Brunch at Eggs Benedict Palace', amount: 90, paidBy: users.testuser._id, days: 21 },
        { desc: 'Brunch at Mimosa Mornings', amount: 105, paidBy: users.alice._id, days: 28 }
    ];

    for (const exp of brunchExpenses) {
        const splitAmount = exp.amount / brunchMembers.length;
        await Expense.create({
            group: brunchClub._id,
            description: exp.desc,
            amount: exp.amount,
            paid_by: exp.paidBy,
            debtors: brunchMembers.map(uid => ({ user: uid, amount: splitAmount })),
            paid_time: daysAgo(exp.days)
        });
    }
    console.log(`Created ${brunchExpenses.length} expenses for Brunch Club`);

    // CALCULATE BALANCES
    console.log('\nCalculating final balances...');
    for (const grp of [japanTrip, roommates, brunchClub]) {
        const memberIds = grp.members.map(m => m.user);
        const balances = {};
        memberIds.forEach(id => balances[id.toString()] = 0);

        const expenses = await Expense.find({ group: grp._id });
        for (const exp of expenses) {
            balances[exp.paid_by.toString()] += exp.amount;
            for (const split of exp.debtors) {
                balances[split.user.toString()] -= split.amount;
            }
        }

        const settlements = await Settlement.find({ group: grp._id });
        for (const s of settlements) {
            balances[s.from_user.toString()] += s.amount;
            balances[s.to_user.toString()] -= s.amount;
        }

        grp.memberBalances = Object.entries(balances).map(([id, bal]) => ({
            userId: new mongoose.Types.ObjectId(id),
            balance: Math.round(bal * 100) / 100
        }));
        await grp.save();
        console.log(`Updated balances for ${grp.name}`);
    }

    console.log('\n========================================');
    console.log('✅ TEST ENVIRONMENT RESET COMPLETE');
    console.log('========================================');
    console.log('All users have password: test123');
    console.log(`Created ${Object.keys(users).length} users, 3 groups, and populated expenses.`);

    await mongoose.disconnect();
}

wipeAndSeed().catch(console.error);
