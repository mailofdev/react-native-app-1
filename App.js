import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Dimensions,
  Text,
  TextInput,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const { width: screenWidth } = Dimensions.get('window');

// API Configuration
const API_URL = 'https://assessments.reliscore.com/api/cric-scores/';
const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';

// Test data
const testData = [
  ["England", 23],
  ["England", 127],
  ["Sri Lanka", 99],
  ["Sri Lanka", 99],
  ["New Zealand", 31],
  ["Sri Lanka", 101],
  ["New Zealand", 81],
  ["Pakistan", 23],
  ["Pakistan", 127],
  ["India", 3],
  ["India", 71],
  ["Australia", 31],
  ["India", 22],
  ["Pakistan", 81]
];

const App = () => {
  const [mode, setMode] = useState("Test");
  const [data, setData] = useState([]);
  const [country, setCountry] = useState("");
  const [average, setAverage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Configuration
  const MAX_RETRIES = 3;
  const INITIAL_TIMEOUT = 1000; // 10 seconds

  const fetchWithRetry = async (attempt = 0) => {
    try {
      console.log(`Fetch attempt ${attempt + 1} started`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.log(`Timeout triggered for attempt ${attempt + 1}`);
      }, INITIAL_TIMEOUT * (attempt + 1));
  
      const response = await fetch(`${API_URL}`, { // Direct API call
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'User-Agent': 'Mozilla/5.0 (compatible; ReactNative)',
        },
      });
  
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const json = await response.json();
      console.log('Fetch successful:', json);
      return json;
    } catch (error) {
      console.error('Fetch error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
  
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  };
  

  const loadData = async () => {
    setLoading(true);
    setError(null);
    setRetryCount(0);
    
    if (mode === "Test") {
      console.log('Loading test data');
      setData(testData);
      setLoading(false);
      return;
    }

    let lastError;
    
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          const delayMs = Math.min(500 * Math.pow(2, attempt), 5000);
          console.log(`Waiting ${delayMs}ms before retry ${attempt}`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          setRetryCount(attempt);
        }
        
        const json = await fetchWithRetry(attempt);
        setData(json);
        setLoading(false);
        return;
      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error);
        lastError = error;
        
        if (attempt === MAX_RETRIES || (error.message.includes('HTTP error') && error.message.includes('4'))) {
          break;
        }
      }
    }
    
    setError(`Failed to load data after ${MAX_RETRIES + 1} attempts: ${lastError.message}`);
    setData([]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [mode]);

  useEffect(() => {
    if (country.trim() === "") {
      setAverage(null);
      return;
    }

    const scores = data
      .filter(([c]) => c.toLowerCase() === country.toLowerCase())
      .map(([, score]) => score);

    if (scores.length > 0) {
      const avg = scores.reduce((sum, val) => sum + val, 0) / scores.length;
      setAverage(avg);
    } else {
      setAverage(null);
    }
  }, [country, data]);

  const getChartData = () => {
    const countryScores = {};
    data.forEach(([c, score]) => {
      if (!countryScores[c]) {
        countryScores[c] = [];
      }
      countryScores[c].push(score);
    });

    return {
      labels: Object.keys(countryScores),
      datasets: [{
        data: Object.values(countryScores).map(scores => 
          scores.reduce((sum, score) => sum + score, 0) / scores.length
        ),
      }]
    };
  };

  const CustomButton = ({ title, isActive, onPress }) => (
    <TouchableOpacity 
      style={[styles.button, isActive && styles.activeButton]} 
      onPress={onPress}
    >
      <Text style={[styles.buttonText, isActive && styles.activeButtonText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f8f8" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Cricket Scores Analysis</Text>

          <View style={styles.buttonGroup}>
            <CustomButton 
              title="Test Data" 
              isActive={mode === "Test"} 
              onPress={() => setMode("Test")} 
            />
            <CustomButton 
              title="Server Data" 
              isActive={mode === "Server"} 
              onPress={() => setMode("Server")} 
            />
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
              {retryCount > 0 && (
                <Text style={styles.retryText}>
                  Retry attempt {retryCount} of {MAX_RETRIES}...
                </Text>
              )}
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.error}>{error}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={loadData}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Enter Country Name:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., India, Pakistan, Australia"
                  value={country}
                  onChangeText={setCountry}
                  placeholderTextColor="#999"
                  autoCorrect={false}
                  autoCapitalize="none"
                />
              </View>

              {country && (
                <View style={styles.averageContainer}>
                  <Text style={styles.label}>Average Score:</Text>
                  <Text style={styles.averageValue}>
                    {average !== null ? average.toFixed(2) : "No data available"}
                  </Text>
                </View>
              )}

              {data.length > 0 && (
                <View style={styles.chartContainer}>
                  <Text style={styles.chartTitle}>Average Scores by Country</Text>
                  <LineChart
                    data={getChartData()}
                    width={screenWidth - 48}
                    height={220}
                    chartConfig={{
                      backgroundColor: "#fff",
                      backgroundGradientFrom: "#fff",
                      backgroundGradientTo: "#fff",
                      decimalPlaces: 1,
                      color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                      style: {
                        borderRadius: 16,
                      },
                      propsForLabels: {
                        fontSize: 12,
                      },
                    }}
                    bezier
                    style={styles.chart}
                  />
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#333',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 8,
    marginBottom: 8,
    minWidth: 120,
  },
  activeButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#333',
  },
  activeButtonText: {
    color: '#fff',
  },
  testButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    marginHorizontal: 8,
    marginBottom: 8,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  loader: {
    marginBottom: 12,
  },
  retryText: {
    color: '#666',
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  error: {
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  averageContainer: {
    marginBottom: 24,
  },
  averageValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  chartContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
});

export default App;