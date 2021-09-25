import { deploy } from "./deps.ts";
import { TicTacToe, Player, Status } from "./game.ts";
import {
  index1D,
  chunkArray,
  decodeString,
  encodeToString,
  noop,
} from "./utils/index.ts";
import { BOARD_SIZE } from "./const.ts";

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

const getMention = (userId: bigint | undefined): string => {
  if (!userId || userId === BigInt(0)) {
    return "Bot";
  }

  return `<@${userId}>`;
};

const getMessageContent = (game: TicTacToe): string => {
  const turn = game.turn;

  const hasEnded = game.status === Status.Ended;
  const hasPlayer = turn !== Player.None;

  const userId = game.toPlay;
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
  const gameData = game.raw;

  return {
    content: getMessageContent(game),
    components: Array.from(chunkArray([...game.state.board], BOARD_SIZE)).map(
      (row, rowIdx): deploy.MessageComponentData => ({
        type: deploy.MessageComponentType.ActionRow,
        components: row.map((cell, cellIdx) => {
          const idx = index1D(rowIdx, cellIdx, BOARD_SIZE);
          const isOccupied = cell !== Player.None;

          return {
            type: deploy.MessageComponentType.Button,
            style: buttonStyles[cell],
            label: isOccupied ? Player[cell] : "\u200b",
            customID: encodeToString(new Uint8Array([idx, ...gameData])),
            disabled: game.status === Status.Ended,
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

  const game = TicTacToe.newGame(interaction.user.id, opponent?.id);

  interaction.reply(gameToMessage(game));
});

deploy.client.on("interaction", (interaction) => {
  if (
    !interaction.isMessageComponent() ||
    interaction.data.component_type !== deploy.MessageComponentType.Button
  ) {
    return;
  }

  const currUser = interaction.user.id;

  const [cellIdx, ...gameState] = decodeString(interaction.data.custom_id);

  const game = TicTacToe.parseGame(new Uint8Array(gameState));

  const turn = game.turn;
  const userToPlay = game.toPlay;

  if (!turn || currUser !== userToPlay?.toString()) {
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
