import React, { useRef } from 'react';
import { View, Text } from 'react-native';

const MyComponent = () => {
  const myRef = useRef();

  // After rendering, you can access the element's dimensions
  const width = myRef.current?.clientWidth || 0;
  const height = myRef.current?.clientHeight || 0;

  return (
    <View ref={myRef}>
      <Text>My element</Text>
    </View>
  );
};

export default MyComponent;
