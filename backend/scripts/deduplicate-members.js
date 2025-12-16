const mongoose = require("mongoose");
const Group = require("../api/models/group.model");

async function deduplicateMembers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/divisely");
        console.log("Connected to MongoDB");

        const groups = await Group.find({});
        let updatedCount = 0;

        for (const group of groups) {
            const originalLength = group.members.length;
            
            // Deduplicate members using Set
            const uniqueMembers = Array.from(
                new Set(group.members.map(m => m.toString()))
            );
            
            if (uniqueMembers.length !== originalLength) {
                group.members = uniqueMembers;
                await group.save();
                updatedCount++;
                console.log(`Deduplicated group ${group._id}: ${originalLength} -> ${uniqueMembers.length} members`);
            }
        }

        console.log(`\nCompleted! Updated ${updatedCount} groups.`);
        await mongoose.connection.close();
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

deduplicateMembers();
