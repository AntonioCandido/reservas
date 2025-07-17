import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import Modal from './Modal';
import Spinner from './Spinner';
import type { Environment, User } from '../../types';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  environments: Environment[];
  onSuggestion: (environment: Environment) => void;
  user: User;
}

const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose, environments, onSuggestion, user }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<{ recommendation: Environment; explanation: string; } | null>(null);

    const handleFindEnvironment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setIsLoading(true);
        setError('');
        setResult(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            
            const environmentData = environments.map(env => ({
                id: env.id,
                name: env.name,
                type: env.environment_types?.name,
                location: env.location,
                resources: env.resources.map(r => r.name),
            }));

            const schema = {
                type: Type.OBJECT,
                properties: {
                    recommendedEnvironmentId: {
                        type: Type.STRING,
                        description: 'O ID do ambiente mais adequado.'
                    },
                    explanation: {
                        type: Type.STRING,
                        description: 'Uma breve explicação (em português e amigável) do porquê este ambiente foi recomendado para o usuário.'
                    }
                },
                required: ['recommendedEnvironmentId', 'explanation']
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `
                    O usuário ${user.name} (cujo perfil é ${user.role}) precisa de um ambiente. A requisição dele é: "${prompt}".

                    Aqui está uma lista de ambientes disponíveis em formato JSON:
                    ${JSON.stringify(environmentData, null, 2)}

                    Analise a requisição do usuário e a lista de ambientes. Recomende o ambiente mais adequado com base nas necessidades descritas.
                    Se o usuário não especificar a quantidade de pessoas, não se preocupe com isso. Priorize os recursos pedidos.
                    Se nenhum ambiente corresponder, explique o porquê na "explanation" e retorne um "recommendedEnvironmentId" vazio ('').
                    Retorne sua resposta estritamente no formato JSON definido pelo schema.
                `,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                },
            });

            const jsonResponse = JSON.parse(response.text);
            const { recommendedEnvironmentId, explanation } = jsonResponse;
            
            if (recommendedEnvironmentId && recommendedEnvironmentId !== '') {
                const recommendedEnv = environments.find(env => env.id === recommendedEnvironmentId);
                if (recommendedEnv) {
                    setResult({ recommendation: recommendedEnv, explanation });
                } else {
                    setError(`A IA recomendou um ambiente inválido (ID: ${recommendedEnvironmentId}). Tente refazer sua pergunta.`);
                }
            } else {
                setError(explanation || 'A IA não conseguiu encontrar um ambiente adequado. Tente ser mais específico.');
            }

        } catch (err: any) {
            console.error('Gemini API Error:', err);
            setError('Ocorreu um erro ao consultar a IA. Por favor, tente novamente mais tarde.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReserveClick = () => {
        if(result) {
            onSuggestion(result.recommendation);
        }
    }

    const handleCloseAndReset = () => {
        setPrompt('');
        setResult(null);
        setError('');
        setIsLoading(false);
        onClose();
    }
    
    return (
        <Modal isOpen={isOpen} onClose={handleCloseAndReset} title="Assistente de Reserva IA">
            <div className="space-y-4">
                <p className="text-gray-600 text-sm">
                    Descreva o que você precisa e a nossa IA encontrará o melhor ambiente para você.
                    <br/>
                    Ex: <span className="italic">"Uma sala com projetor para uma apresentação para 15 pessoas."</span>
                </p>

                <form onSubmit={handleFindEnvironment}>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Digite sua necessidade aqui..."
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-estacio-blue focus:border-estacio-blue"
                        rows={3}
                        disabled={isLoading}
                        aria-label="Descrição da necessidade do ambiente"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !prompt.trim()}
                        className="w-full mt-2 flex items-center justify-center gap-2 bg-estacio-blue hover:bg-opacity-90 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50"
                    >
                        {isLoading ? <Spinner /> : (
                            <>
                                <i className="bi bi-magic"></i>
                                <span>Encontrar Ambiente</span>
                            </>
                        )}
                    </button>
                </form>

                {error && <p className="text-red-500 text-center text-sm font-semibold bg-red-100 p-2 rounded-md">{error}</p>}

                {result && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg animate-fade-in">
                        <h4 className="font-semibold text-lg text-estacio-blue">Sugestão da IA:</h4>
                        
                        <div className="bg-white my-2 p-3 rounded-md shadow-sm">
                            <h5 className="font-bold text-gray-800">{result.recommendation.name}</h5>
                            <p className="text-sm text-gray-600">{result.recommendation.location}</p>
                            <p className="text-sm text-gray-500">Recursos: {result.recommendation.resources?.map(r => r.name).join(', ') || 'N/A'}</p>
                        </div>

                        <p className="text-sm text-gray-700 italic border-l-4 border-estacio-blue pl-3 py-1">"{result.explanation}"</p>
                        
                        <button
                            onClick={handleReserveClick}
                            className="w-full mt-4 bg-estacio-red text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90"
                        >
                            Reservar este ambiente
                        </button>
                    </div>
                )}
            </div>
            <style>{`
                @keyframes animate-fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: animate-fade-in 0.5s ease-out forwards;
                }
            `}</style>
        </Modal>
    );
};

export default AIAssistantModal;