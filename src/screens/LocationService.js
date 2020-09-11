//https://forums.expo.io/t/how-to-setstate-from-within-taskmanager/26630/5
const LocationService = () => {
  let subscribers = []
  let location = {
    latitude: 0,
    longitude: 0
  }

  return {
    subscribe: (sub) => subscribers.push(sub),
    setLocation: (coords) => {
      location = coords
      subscribers.forEach((sub) => sub(location))
    },
    unsubscribe: (sub) => {
      subscribers = subscribers.filter((_sub) => _sub !== sub)
    }
  }
}

export const locationService = LocationService()
