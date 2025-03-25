/**
 * Configurações globais da aplicação
 */
export const CONFIG = {
    API_KEY: "bf5e8542-8a21-11ef-8d8d-0242ac130003-bf5e8614-8a21-11ef-8d8d-0242ac130003", // StormGlass API Key primária
    // Array de chaves API alternativas para rotação caso uma chave atinja seu limite
    API_KEYS: [
        "bf5e8542-8a21-11ef-8d8d-0242ac130003-bf5e8614-8a21-11ef-8d8d-0242ac130003", // Chave primária
        "ea996e2a-88a5-11ef-ae24-0242ac130003-ea996e98-88a5-11ef-ae24-0242ac130003", // Chave alternativa 1
        "6b7ca118-da20-11ee-8a07-0242ac130002-6b7ca186-da20-11ee-8a07-0242ac130002", // Chave alternativa 2
        "1d6c47a6-8a21-11ef-a0d5-0242ac130003-1d6c4814-8a21-11ef-a0d5-0242ac130003"  // Chave alternativa 3
    ],
    OPENWEATHER_KEY: "298eb70e474f38c9201f3767d6059bf9", // OpenWeatherMap API Key
    LATITUDE: -23.9608,
    LONGITUDE: -46.3336,
    CACHE_EXPIRACAO: 3600000, // 1 hora em milissegundos
};

/**
 * Constantes de localização e cálculos
 */
export const LOCALIZACAO = {
    HEMISFERIO_SUL: (CONFIG.LATITUDE < 0),
}; 