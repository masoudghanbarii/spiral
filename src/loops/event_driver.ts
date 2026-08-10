import { Config } from "../config.js";
import { LLMClient } from "../llm.js";
import type { ManagerRegistry } from "../managers/index.js";
import { Feature, HarnessState, TraceEntry } from "../models.js";

export class EventDriver {
  private managers: ManagerRegistry;
  private llm: LLMClient;

  constructor(_config: Config, managers: ManagerRegistry, llm: LLMClient) {
    this.managers = managers;
    this.llm = llm;
  }

  getNextFeature(state: HarnessState): Feature | null {
    if (state.currentFeatureIndex < state.features.length)
      return state.features[state.currentFeatureIndex]!;
    return null;
  }

  async onFeatureComplete(state: HarnessState, feature: Feature): Promise<void> {
    state.completedFeatures.push(feature.name);
    state.currentFeatureIndex++;
    feature.status = "completed";

    await this.managers.traces.record(
      new TraceEntry({
        event_type: "event_complete",
        loop_name: "event_driver",
        feature: feature.name,
        data: { status: "completed", next_index: state.currentFeatureIndex },
      }),
    );

    await this.managers.project.markAdrDone(feature.adrSection);
    await this.managers.state.save(state);
  }

  async onFeatureFailed(state: HarnessState, feature: Feature): Promise<void> {
    state.failedFeatures.push(feature.name);
    state.currentFeatureIndex++;
    feature.status = "failed";

    await this.managers.traces.record(
      new TraceEntry({
        event_type: "error",
        loop_name: "event_driver",
        feature: feature.name,
        data: { status: "failed" },
      }),
    );

    await this.managers.state.save(state);
  }

  hasMoreWork(state: HarnessState): boolean {
    return state.currentFeatureIndex < state.features.length;
  }

  async generateEventsFromAdr(state?: HarnessState): Promise<Feature[]> {
    const adr = await this.managers.project.readAdr();
    const promptParts: string[] = [
      "Parse this ADR and extract all implementable features as a JSON array.\nEach feature needs: name, description, adr_section.",
    ];
    if (state && state.harnessImprovements.length > 0) {
      promptParts.push(
        `Previous harness improvements from meta-analysis:\n${state.harnessImprovements.join("\n")}`,
      );
    }
    promptParts.push(
      `\nADR:\n${adr.slice(0, 8000)}`,
      'Return JSON array: [{"name": "...", "description": "...", "adr_section": "..."}]\nInclude ALL sections that need implementation.',
    );
    const prompt = promptParts.join("\n\n");

    const response = await this.llm.generate(
      prompt,
      "You extract implementable features from architecture documents.",
    );
    const featuresData = this.llm.extractJson(response) as
      { name: string; description: string; adr_section: string }[] | null;

    if (!featuresData) return [];
    return featuresData.map((f) => new Feature(f));
  }
}
