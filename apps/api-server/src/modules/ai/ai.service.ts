import { Injectable } from "@nestjs/common";

@Injectable()
export class AiService {
  health() {
    return {
      service: "ai-engine",
      status: "placeholder-ready"
    };
  }
}
