import MapboxNavigation from '@pawan-pk/react-native-mapbox-navigation';
import {StyleSheet} from 'react-native';

export default function App() {
  return (
    <MapboxNavigation
      startOrigin={{latitude: 53.3965812, longitude: -2.9804447}} // Your current location
      destination={{latitude: 51.47002, longitude: -0.454295}} // London Heathrow Airport
      style={styles.container}
      shouldSimulateRoute={false}
      showCancelButton={true}
      language="en"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
