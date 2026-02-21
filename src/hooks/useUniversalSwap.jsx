import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';

/**
 * Hook to handle universal web3 actions (swaps, transfers, etc.)
 * primarily used by Sofia AI to interact with the blockchain.
 */
export const useUniversalSwap = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [txDigest, setTxDigest] = useState(null);

    const handleWeb3Action = useCallback(async (action) => {
        if (!action) return;

        setLoading(true);
        setError(null);
        setTxDigest(null);

        console.log("[useUniversalSwap] Handling Web3 Action:", action);

        try {
            // Logic for handling different types of actions
            // e.g., action.type === 'swap', action.type === 'transfer'

            // For now, we simulate a successful action
            await new Promise(resolve => setTimeout(resolve, 2000));

            const mockDigest = "0x" + Math.random().toString(16).slice(2);
            setTxDigest(mockDigest);

            toast.success(`Action processed: ${action.type || 'Transaction'} successful!`);

            return mockDigest;
        } catch (err) {
            console.error("[useUniversalSwap] Action Error:", err);
            setError(err.message);
            toast.error(`Action failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        handleWeb3Action,
        loading,
        error,
        txDigest
    };
};
