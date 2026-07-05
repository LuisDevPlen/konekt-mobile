import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SearchStackParamList } from '../types';
import { colors } from '../theme/ifood';
import { SearchScreen } from '../screens/SearchScreen';
import { ConnectionErrorScreen } from '../screens/ErrorScreens';

const Stack = createNativeStackNavigator<SearchStackParamList>();

export function SearchStack() {
  return (
    <Stack.Navigator
      initialRouteName="SearchHome"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="SearchHome" component={SearchScreen} />
      <Stack.Screen name="ConnectionError" component={ConnectionErrorScreen} />
    </Stack.Navigator>
  );
}
