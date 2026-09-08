import { type Request, type Response, Router } from "express";
import { SuccessResponse } from "../../common/exceptions/sucsses.response";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validation } from "../../middleware/validation.middleware";
import chatService from "./chat.service";
import { z } from "zod";

const id = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");
const conversationId = { params: z.object({ conversationId: id }) };
const createConversation = { body: z.object({ receiverId: id }) };
const history = {
  ...conversationId,
  query: z.object({
    cursor: id.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(30),
  }),
};
const router = Router();

router.post(
  "/",
  authMiddleware,
  validation(createConversation),
  async (req: Request, res: Response) => {
    const data = await chatService.createConversation(
      req.user!.id,
      req.body.receiverId,
    );
    return SuccessResponse({
      res,
      status: 201,
      message: "Conversation created",
      data,
    });
  },
);
router.get("/", authMiddleware, async (req: Request, res: Response) =>
  SuccessResponse({
    res,
    message: "Conversations fetched",
    data: await chatService.listConversations(req.user!.id),
  }),
);
router.get(
  "/:conversationId",
  authMiddleware,
  validation(conversationId),
  async (req: Request, res: Response) =>
    SuccessResponse({
      res,
      message: "Conversation fetched",
      data: await chatService.getConversation(
        req.user!.id,
        req.params.conversationId as string,
      ),
    }),
);
router.get(
  "/:conversationId/messages",
  authMiddleware,
  validation(history),
  async (req: Request, res: Response) => {
    const query = history.query.parse(req.query);
    return SuccessResponse({
      res,
      message: "Messages fetched",
      data: await chatService.history(
        req.user!.id,
        req.params.conversationId as string,
        query.cursor,
        query.limit,
      ),
    });
  },
);
router.patch(
  "/:conversationId/read",
  authMiddleware,
  validation(conversationId),
  async (req: Request, res: Response) =>
    SuccessResponse({
      res,
      message: "Messages marked as read",
      data: {
        readAt: await chatService.markRead(
          req.user!.id,
          req.params.conversationId as string,
        ),
      },
    }),
);
export default router;
