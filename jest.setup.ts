/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-ignore
import mockAsyncStorage from '@react-native-community/async-storage/jest/async-storage-mock'
jest.mock('@react-native-community/async-storage', () => mockAsyncStorage)
