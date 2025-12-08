import '@testing-library/jest-native/extend-expect';

// Silence warnings from animation helpers not implemented in Jest
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
