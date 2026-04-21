import { describe, it, expect } from 'vitest';
import { calculateSmartDecisions } from './decisionEngine';
import { STADIUM_LOCATIONS } from '../hooks/useMapLogic';

describe('Decision Engine Logic (Advanced)', () => {
    it('should recommend Gate 3 when it has less crowd than Gate 5', () => {
        const sections = [
            { id: 'gate-3', count: 20 },
            { id: 'gate-5', count: 80 }
        ];
        const result = calculateSmartDecisions(sections, [], []);
        expect(result.entryGate.id).toBe('gate-3');
        expect(result.entryReason).toContain('Best Decision');
        expect(result.entryReason).toContain('20 units');
    });

    it('should recommend Gate 5 when it has less crowd than Gate 3', () => {
        const sections = [
            { id: 'gate-3', count: 90 },
            { id: 'gate-5', count: 10 }
        ];
        const result = calculateSmartDecisions(sections, [], []);
        expect(result.entryGate.id).toBe('gate-5');
    });

    it('should default to Gate 5 for entry when crowds are exactly equal (tie-breaking)', () => {
        const sections = [
            { id: 'gate-3', count: 50 },
            { id: 'gate-5', count: 50 }
        ];
        const result = calculateSmartDecisions(sections, [], []);
        // In the code: g3Count < g5Count ? GATES[0] : GATES[1]. 50 is NOT < 50, so GATES[1] (Gate 5)
        expect(result.entryGate.id).toBe('gate-5');
    });

    it('should find the food stall with the shortest wait time across multiple categories', () => {
        const foodStalls = [
            { id: 'f1', name: 'Stall A', wait: 15, type: 'food' },
            { id: 'f2', name: 'Stall B', wait: 2, type: 'food' },
            { id: 'f3', name: 'Stall C', wait: 10, type: 'food' },
            { id: 'w1', name: 'Washroom', wait: 1, type: 'restroom' } // Should ignore non-food
        ];
        const result = calculateSmartDecisions([], foodStalls, []);
        expect(result.bestFood.name).toBe('Stall B');
        expect(result.foodReason).toContain('Best Decision');
        expect(result.foodReason).toContain('2m wait');
    });

    it('should optimize transport based on composite Score: (Wait - Capacity/10)', () => {
        const transports = [
            { type: 'Metro', station: 'A', wait: 10, capacity: 90 }, // Score: 10 - 9 = 1
            { type: 'Bus', station: 'B', wait: 5, capacity: 10 },    // Score: 5 - 1 = 4
            { type: 'Taxi', station: 'C', wait: 2, capacity: 5 }      // Score: 2 - 0.5 = 1.5
        ];
        const result = calculateSmartDecisions([], [], transports);
        // Metro (1) < Taxi (1.5) < Bus (4)
        expect(result.bestTransportObj.type).toBe('Metro');
    });

    it('should handle missing data with safe high-availability fallbacks', () => {
        const result = calculateSmartDecisions(null, null, null);
        
        expect(result.entryGate).toEqual(STADIUM_LOCATIONS.GATES[1]); // Default fallback in g3 < g5 check
        expect(result.bestFood.name).toBe('Quick Bites');
        expect(result.bestTransportObj.type).toBe('Metro');
    });

    it('should identify the correct exit gate (inverse of entry)', () => {
        const result = calculateSmartDecisions([{ id: 'gate-3', count: 10 }], [], []);
        expect(result.exitGate.id).toBe('gate-5');
    });

    it('should handle missing or corrupt telemetry data gracefully', () => {
        const result = calculateSmartDecisions(null, undefined, []);
        expect(result.bestFood.type).toBe('Food Hub');
        expect(result.bestTransportObj.type).toBe('Metro');
    });

    it('should include a tactical summary in the output', () => {
        const result = calculateSmartDecisions(null, null, null);
        expect(result.overallSummary).toBeDefined();
        expect(result.overallSummary).toContain('System state optimal');
    });
});
