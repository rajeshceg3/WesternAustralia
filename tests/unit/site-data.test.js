import { sitesConfig } from '../../sitesConfig.js';

describe('sitesConfig Integrity', () => {
    test('sitesConfig should be an array', () => {
        expect(Array.isArray(sitesConfig)).toBe(true);
    });

    test('sitesConfig should not be empty', () => {
        expect(sitesConfig.length).toBeGreaterThan(0);
    });

    sitesConfig.forEach((site, index) => {
        describe(`Testing site data at index ${index}: ${site.name || 'Unknown Name'}`, () => {
            test(`Site ${index} has 'id'`, () => {
                expect(typeof site.id).toBe('string');
            });
            test(`Site ${index} has 'name'`, () => {
                expect(typeof site.name).toBe('string');
            });
            test(`Site ${index} has 'description'`, () => {
                expect(typeof site.description).toBe('string');
            });
            test(`Site ${index} has 'modelUrl'`, () => {
                expect(typeof site.modelUrl).toBe('string');
            });
        });
    });
});
