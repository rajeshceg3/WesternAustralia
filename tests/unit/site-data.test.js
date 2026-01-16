// In site-data.test.js

// This is the sitesData from *inside* the main() function.
const sitesData = [
    {
        name: "Site 1 (Pinnacles-like)",
        createFunc: () => {}, // Mock function for testing data structure
        bgColor: 0xFAEBD7,
        description: "Placeholder for The Pinnacles: Thousands of limestone pillars rising from the yellow sands of Nambung National Park."
    },
    {
        name: "Site 2 (Wave Rock-like)",
        createFunc: () => {}, // Mock function
        bgColor: 0xFFE4B5,
        description: "Placeholder for Wave Rock: A giant, multi-coloured granite wave about to crash into the bush. Located near Hyden."
    },
    {
        name: "Site 3 (Gorge/Pillars)",
        createFunc: () => {}, // Mock function
        bgColor: 0xB0C4DE,
        description: "Placeholder for a Karijini-style Gorge: Ancient, deep gorges with dramatic rock formations and seasonal waterfalls."
    }
];

describe('sitesData Integrity', () => {
    test('sitesData should be an array', () => {
        expect(Array.isArray(sitesData)).toBe(true);
    });

    test('sitesData should not be empty', () => {
        expect(sitesData.length).toBeGreaterThan(0);
    });

    sitesData.forEach((site, index) => {
        describe(`Testing site data at index ${index}: ${site.name || 'Unknown Name'}`, () => {
            test(`Site ${index} 'name' should be a string`, () => {
                expect(typeof site.name).toBe('string');
            });
            test(`Site ${index} 'description' should be a string`, () => {
                expect(typeof site.description).toBe('string');
            });
            test(`Site ${index} 'createFunc' should be a function`, () => {
                expect(typeof site.createFunc).toBe('function');
            });
            // bgColor is also present, could add a test for it
            test(`Site ${index} 'bgColor' should be a number (color hex)`, () => {
                expect(typeof site.bgColor).toBe('number');
            });
        });
    });
});
