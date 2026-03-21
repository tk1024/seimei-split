// Frequency plugin interface - implementation in v2
export interface FrequencyProvider {
  getSurnameFrequency(surface: string): number | undefined;
  getGivenNameFrequency(surface: string): number | undefined;
}
