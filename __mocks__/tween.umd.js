module.exports = {
    Tween: jest.fn(() => ({
        to: jest.fn(() => ({
            easing: jest.fn(() => ({
                start: jest.fn(),
            })),
        })),
    })),
    Easing: {
        Quadratic: {
            InOut: jest.fn(),
        },
    },
};
