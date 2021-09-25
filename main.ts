import * as deploy from "https://code.harmony.rocks/v2.2.0/deploy.ts";
import { TicTacToe, CellState } from "./game.ts";
import { encode, decode } from "https://deno.land/std@0.106.0/encoding/hex.ts";
import { index1D } from "./utils.ts";

const BOARD_SIZE = 3;

deploy.init({
  env: true,
});

const commands = await deploy.commands.all();
if (commands.size !== 1) {
  deploy.commands.bulkEdit([
    {
      name: "play",
      description: "Play a game of Tic-Tac-Toe.",
      options: [
        {
          name: "opponent",
          description: "User to play with. Leave empty for playing with a bot.",
          type: deploy.SlashCommandOptionType.USER,
          required: false,
        },
      ],
    },
  ]);
}

const noop = {
  type: deploy.InteractionResponseType.DEFERRED_MESSAGE_UPDATE,
};

const decoder = new TextDecoder();
const encoder = new TextEncoder();

function decodeString(hex: string) {
  return decode(encoder.encode(hex));
}

function encodeToString(data: Uint8Array) {
  return decoder.decode(encode(data));
}

function* chunkArray<T>(array: T[], size: number) {
  for (let i = 0; i < array.length; i += size) {
    yield array.slice(i, i + size);
  }
}

const getMention = (userId: bigint): string => {
  if (userId === BigInt(0)) {
    return "Bot";
  }

  return `<@${userId}>`;
};

const getMessageContent = (game: TicTacToe): string => {
  const turn = game.turn;

  const hasEnded = game.hasEnded;
  const hasPlayer = turn !== CellState.Empty;

  const userId = turn === CellState.X ? game.playerX : game.playerY;
  const mention = getMention(userId);

  if (!hasEnded) {
    return `It's ${mention}'s turn!`;
  }

  if (hasPlayer) {
    return `${mention} has won the game!`;
  }

  return "It's a draw!";
};

const buttonStyles = [
  deploy.ButtonStyle.SECONDARY,
  deploy.ButtonStyle.SUCCESS,
  deploy.ButtonStyle.DESTRUCTIVE,
];

const gameToMessage = (game: TicTacToe): deploy.InteractionMessageOptions => {
  const gameData = game.data.slice(0, game.getSize());

  return {
    content: getMessageContent(game),
    components: Array.from(chunkArray([...game.board], BOARD_SIZE)).map(
      (row, rowIdx): deploy.MessageComponentData => ({
        type: deploy.MessageComponentType.ActionRow,
        components: row.map((cell, cellIdx) => {
          const idx = index1D(rowIdx, cellIdx, BOARD_SIZE);
          const isOccupied = cell !== CellState.Empty;

          return {
            type: deploy.MessageComponentType.Button,
            style: buttonStyles[cell],
            label: isOccupied ? CellState[cell] : "\u200b",
            customID: encodeToString(new Uint8Array([...gameData, idx])),
            disabled: !!game.hasEnded,
          };
        }),
      })
    ),
  };
};

deploy.handle("play", (interaction) => {
  const opponent = interaction.option<deploy.InteractionUser | undefined>(
    "opponent"
  );

  if (interaction.user.id === opponent?.id) {
    return interaction.reply("You played yourself. Wait, you can't.", {
      ephemeral: true,
    });
  }

  const game = new TicTacToe(BOARD_SIZE, interaction.user.id, opponent?.id);
  const message = gameToMessage(game);

  interaction.reply(message);
});

deploy.client.on("interaction", (interaction) => {
  if (
    !interaction.isMessageComponent() ||
    interaction.data.component_type !== deploy.MessageComponentType.Button
  ) {
    return;
  }

  const currUser = interaction.user.id;

  const game = new TicTacToe(decodeString(interaction.data.custom_id));

  const turn = game.turn;
  const userToPlay = turn === CellState.X ? game.playerX : game.playerY;
  const cellIdx = game.data.at(-1)!;

  if (!turn || currUser !== userToPlay.toString()) {
    return interaction.respond(noop);
  }

  if (!game.playTurn(cellIdx)) {
    return interaction.respond(noop);
  }

  game.hasOpponent || game.playBotTurn();

  interaction.respond({
    type: deploy.InteractionResponseType.UPDATE_MESSAGE,
    ...gameToMessage(game),
  });
});
